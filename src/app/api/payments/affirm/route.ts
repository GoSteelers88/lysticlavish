import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeTransaction,
  captureTransaction,
  voidTransaction,
  readTransaction,
  isOutcomeUnknown,
  getClientConfig,
  isAffirmConfigured,
} from '@/lib/affirm/client';
import {
  getBookingById,
  getPaymentBySquareId,
  createPayment,
  updatePaymentBySquareId,
} from '@/lib/google/sheets';
import {
  resolveBookingServices,
  confirmPaidBooking,
  findOtherActivePayment,
} from '@/lib/bookings/confirm';
import {
  processAffirmPaymentSchema,
  validateData,
  ValidationError,
} from '@/lib/validation/schemas';

/**
 * GET /api/payments/affirm
 * Affirm configuration for the booking page (public key, script URL, minimum).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: getClientConfig(),
  });
}

// Returned when we can't tell what Affirm did. The page keeps the checkout
// token and its "Finish booking" button retries with it — every Affirm call is
// idempotent per token, so a retry can never create or charge a second loan.
function outcomeUnknown(bookingId: string, transactionId: string | null, step: string) {
  console.error(
    `[API] Affirm ${step} outcome unknown — booking ${bookingId}, transaction ${transactionId ?? 'n/a'}`
  );
  return NextResponse.json(
    {
      success: false,
      error:
        'Your Affirm loan was approved, but we could not finish your booking. Please tap "Finish booking" to try again — you will not be charged twice.',
      code: 'AFFIRM_OUTCOME_UNKNOWN',
    },
    { status: 503 }
  );
}

async function voidAndLog(transactionId: string, bookingId: string, reason: string) {
  const result = await voidTransaction(transactionId);
  if (!result.success) {
    console.error(
      `[API] Affirm void FAILED for ${transactionId} (booking ${bookingId}, ${reason}): ${result.error}`
    );
  }
  return result;
}

/**
 * POST /api/payments/affirm
 * Confirm a booking paid in full with an Affirm loan.
 *
 * Body:
 * - bookingId: ID of the pending booking
 * - checkoutToken: checkout_token from the Affirm modal's onSuccess callback
 *
 * The browser's "success" is not trusted. The loan only counts once Affirm
 * authorizes it at exactly the booking total.
 *
 * Flow:
 * 1. Validate input, load booking, total its services from services.json
 * 2. Authorize the loan with Affirm
 * 3. Verify the booking is still pending and the loan covers the full total
 *    (anything else is voided so the customer isn't left with a loan)
 * 4. Record an AFFIRM "pending" payment row — from here on the card route
 *    refuses this booking, and a captured loan is never invisible in the sheet
 * 5. Capture the loan; an unknown outcome is retried/read, never voided
 * 6. Mark the payment completed, create calendar event, confirm, send emails
 */
export async function POST(request: NextRequest) {
  let bookingId = 'unknown';
  let transactionId: string | null = null;

  try {
    if (!isAffirmConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Affirm is not available right now' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = validateData(processAffirmPaymentSchema, body);
    bookingId = data.bookingId;

    const booking = await getBookingById(data.bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Services always come from the booking itself, never the request body
    const bookingServices = resolveBookingServices(booking);
    if (!bookingServices) {
      return NextResponse.json(
        { success: false, error: 'One or more services not found' },
        { status: 404 }
      );
    }
    const totalCents = bookingServices.totalPriceCents;

    // 2. Authorize (idempotent per checkout token, so a retry returns the same loan)
    const auth = await authorizeTransaction(data.checkoutToken, booking.id);
    if (!auth.success || !auth.data) {
      if (isOutcomeUnknown(auth)) {
        return outcomeUnknown(booking.id, null, 'authorize');
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Affirm could not confirm this loan. Please try again or pay by card.',
          code: auth.errorCode,
        },
        { status: 402 }
      );
    }
    const transaction = auth.data;
    transactionId = transaction.id;

    // Earlier attempt with this loan?
    const existingPayment = await getPaymentBySquareId(transaction.id);
    if (existingPayment && existingPayment.bookingId !== booking.id) {
      console.warn(
        `[API] Affirm loan ${transaction.id} already recorded for booking ${existingPayment.bookingId}, not ${booking.id}`
      );
      return NextResponse.json(
        { success: false, error: 'This Affirm loan does not match your booking' },
        { status: 400 }
      );
    }

    // Already done: finish confirming if needed, never charge again
    if (existingPayment?.status === 'completed') {
      const result = await confirmPaidBooking({
        booking,
        bookingServices,
        payment: existingPayment,
        amountPaidCents: existingPayment.amountCents,
        paymentMethod: 'affirm',
      });

      return NextResponse.json({
        success: true,
        data: {
          booking: result.confirmedBooking,
          payment: { id: existingPayment.id, status: existingPayment.status },
        },
      });
    }

    if (existingPayment?.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: 'This Affirm loan was cancelled. Please start Affirm again or pay by card.',
        },
        { status: 402 }
      );
    }

    // 3. Booking must still be payable
    if (booking.status !== 'pending') {
      // With a pending row the loan may already be captured — leave it for
      // the owner to refund rather than guess
      if (!existingPayment) {
        await voidAndLog(transaction.id, booking.id, `booking ${booking.status}`);
      } else {
        console.error(
          `[API] Affirm loan ${transaction.id} in progress but booking ${booking.id} is ${booking.status}`
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Booking cannot be paid. Current status: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // The authorize response is replayed on retries, so it still reads
    // 'authorized' after a capture — that's the state this check is about
    if (
      transaction.status !== 'authorized' ||
      transaction.amount !== totalCents ||
      transaction.currency !== 'USD'
    ) {
      console.warn(
        `[API] Affirm loan ${transaction.id} rejected: status ${transaction.status}, ` +
          `amount ${transaction.amount} ${transaction.currency}, expected ${totalCents} USD`
      );
      await voidAndLog(transaction.id, booking.id, 'amount mismatch');
      if (existingPayment) {
        await updatePaymentBySquareId(transaction.id, { status: 'failed' });
      }
      return NextResponse.json(
        { success: false, error: 'Affirm loan amount does not match the booking total' },
        { status: 400 }
      );
    }

    // 4. Record the loan before capturing it, then make sure no other payment
    // (e.g. a card deposit) claimed this booking at the same moment
    const record =
      existingPayment ??
      (await createPayment({
        bookingId: booking.id,
        squarePaymentId: transaction.id,
        amountCents: totalCents,
        status: 'pending',
        paymentMethod: 'AFFIRM',
      }));

    const otherPayment = await findOtherActivePayment(booking.id, record.id);
    if (otherPayment) {
      console.warn(
        `[API] Affirm loan ${transaction.id} refused: booking ${booking.id} claimed by ${otherPayment.paymentMethod} ${otherPayment.squarePaymentId}`
      );
      // A first attempt hasn't captured yet, so the loan can be cancelled.
      // A retry might have — leave that one for the owner rather than guess.
      if (!existingPayment) {
        await voidAndLog(transaction.id, booking.id, 'booking claimed by another payment');
        await updatePaymentBySquareId(transaction.id, { status: 'failed' });
      }
      return NextResponse.json(
        {
          success: false,
          error: 'This booking already has a payment in progress. Please contact us if you need help.',
        },
        { status: 409 }
      );
    }

    // 5. Capture — retry once on an unknown outcome (same Idempotency-Key)
    let capture = await captureTransaction(transaction.id, booking.id);
    if (!capture.success && isOutcomeUnknown(capture)) {
      capture = await captureTransaction(transaction.id, booking.id);
    }

    if (!capture.success) {
      // Ask Affirm what actually happened before deciding anything
      const current = await readTransaction(transaction.id);
      const capturedAnyway = current.success && current.data?.status === 'captured';

      if (!capturedAnyway) {
        if (isOutcomeUnknown(capture) || !current.success) {
          return outcomeUnknown(booking.id, transaction.id, 'capture');
        }

        // Affirm definitively refused the capture: cancel the loan
        console.error(`[API] Affirm capture refused for ${transaction.id}:`, capture.error);
        await voidAndLog(transaction.id, booking.id, 'capture refused');
        await updatePaymentBySquareId(transaction.id, { status: 'failed' });

        return NextResponse.json(
          {
            success: false,
            error: 'Affirm could not complete this payment. Please try again or pay by card.',
            code: capture.errorCode,
          },
          { status: 402 }
        );
      }
    }

    // 6. Mark paid, then calendar event, confirm booking, emails
    const payment = await updatePaymentBySquareId(transaction.id, { status: 'completed' });
    if (!payment) {
      throw new Error(`Affirm payment row for ${transaction.id} not found after capture`);
    }

    const { confirmedBooking, calendarEventId } = await confirmPaidBooking({
      booking,
      bookingServices,
      payment,
      amountPaidCents: totalCents,
      paymentMethod: 'affirm',
    });

    return NextResponse.json({
      success: true,
      data: {
        booking: confirmedBooking,
        payment: {
          id: payment.id,
          status: payment.status,
        },
        calendarEventCreated: !!calendarEventId,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      `[API] Affirm payment error — booking ${bookingId}, transaction ${transactionId ?? 'n/a'}:`,
      error
    );

    // Once Affirm has authorized, a crash here (e.g. Sheets down) may follow a
    // capture — keep the customer on the retry path, never "pay by card"
    if (transactionId) {
      return outcomeUnknown(bookingId, transactionId, 'post-authorize');
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process Affirm payment' },
      { status: 500 }
    );
  }
}
