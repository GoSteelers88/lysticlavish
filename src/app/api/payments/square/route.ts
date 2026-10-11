import { NextRequest, NextResponse } from 'next/server';
import { processPayment, getClientConfig } from '@/lib/square/client';
import {
  getBookingById,
  getPaymentsByBookingId,
  createPayment,
  updatePayment,
} from '@/lib/google/sheets';
import {
  resolveBookingServices,
  confirmPaidBooking,
  findOtherActivePayment,
} from '@/lib/bookings/confirm';
import {
  processPaymentSchema,
  validateData,
  ValidationError,
} from '@/lib/validation/schemas';

/**
 * GET /api/payments/square
 * Get Square client configuration for frontend SDK.
 */
export async function GET() {
  try {
    const config = getClientConfig();

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[API] Get Square config error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/square
 * Process a payment for a booking.
 *
 * Body:
 * - bookingId: ID of the pending booking
 * - sourceId: Payment token from Square Web Payments SDK
 * - amountCents: Amount to charge in cents
 *
 * Flow:
 * 1. Validate input
 * 2. Verify booking exists and is pending
 * 3. Verify amount matches service price
 * 4. Process payment with Square
 * 5. Create payment record
 * 6. Create calendar event
 * 7. Update booking to confirmed
 * 8. Return confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const data = validateData(processPaymentSchema, body);

    // Get booking
    const booking = await getBookingById(data.bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify booking is pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Booking cannot be paid. Current status: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // Quick check: an Affirm loan in progress (or any non-failed payment) means
    // this booking must not be charged by card. The claim below is what
    // actually guarantees one payment per booking; this just avoids a row.
    const activePayments = (await getPaymentsByBookingId(booking.id)).filter(
      (p) => p.status !== 'failed'
    );
    if (activePayments.length > 0) {
      console.warn(
        `[API] Card payment refused: booking ${booking.id} already has payment ${activePayments[0].squarePaymentId} (${activePayments[0].paymentMethod}, ${activePayments[0].status})`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'This booking already has a payment in progress. Please contact us if you need help.',
        },
        { status: 409 }
      );
    }

    // Services come from the booking itself — never from the request body,
    // which the browser controls
    const bookingServices = resolveBookingServices(booking);
    if (!bookingServices) {
      return NextResponse.json(
        { success: false, error: 'One or more services not found' },
        { status: 404 }
      );
    }
    const { totalPriceCents } = bookingServices;
    const primaryService = bookingServices.services[0];

    // Verify amount matches 50% deposit (same formula as PaymentForm)
    const expectedDepositCents = Math.ceil(totalPriceCents * 0.5);
    if (data.amountCents !== expectedDepositCents) {
      console.warn(
        `[API] Amount mismatch: expected deposit ${expectedDepositCents}, got ${data.amountCents}`
      );
      return NextResponse.json(
        { success: false, error: 'Payment amount does not match service price' },
        { status: 400 }
      );
    }

    // Claim the booking: record this payment before charging, then make sure
    // no other payment (e.g. Affirm) started on it at the same moment
    const reservation = await createPayment({
      bookingId: booking.id,
      squarePaymentId: 'card-pending',
      amountCents: data.amountCents,
      status: 'pending',
      paymentMethod: 'card',
    });
    const otherPayment = await findOtherActivePayment(booking.id, reservation.id);
    if (otherPayment) {
      await updatePayment(reservation.id, { status: 'failed' });
      console.warn(
        `[API] Card payment refused: booking ${booking.id} claimed by ${otherPayment.paymentMethod} ${otherPayment.squarePaymentId}`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'This booking already has a payment in progress. Please contact us if you need help.',
        },
        { status: 409 }
      );
    }

    // Process payment with Square
    const paymentResult = await processPayment({
      sourceId: data.sourceId,
      amountCents: data.amountCents,
      note: `Lystic Lavish - ${primaryService.name} for ${booking.customerName}`,
      referenceId: booking.id,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      console.error('[API] Payment failed:', paymentResult.error);

      // Record the failed payment
      await updatePayment(reservation.id, {
        squarePaymentId: paymentResult.paymentId || 'failed',
        status: 'failed',
        paymentMethod: paymentResult.cardBrand || 'unknown',
      });

      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Payment processing failed',
          code: paymentResult.errorCode,
        },
        { status: 402 } // Payment Required
      );
    }

    // Record the completed payment
    const payment = await updatePayment(reservation.id, {
      squarePaymentId: paymentResult.paymentId,
      status: 'completed',
      paymentMethod: paymentResult.cardBrand || 'card',
    });
    if (!payment) {
      throw new Error(`Payment row ${reservation.id} not found after charging ${paymentResult.paymentId}`);
    }

    // Calendar event, confirm booking, emails
    const { confirmedBooking, calendarEventId } = await confirmPaidBooking({
      booking,
      bookingServices,
      payment,
      amountPaidCents: data.amountCents,
      paymentMethod: 'card_deposit',
    });

    return NextResponse.json({
      success: true,
      data: {
        booking: confirmedBooking,
        payment: {
          id: payment.id,
          status: payment.status,
          receiptUrl: paymentResult.receiptUrl,
          cardBrand: paymentResult.cardBrand,
          last4: paymentResult.last4,
        },
        calendarEventCreated: !!calendarEventId,
      },
    });
  } catch (error) {
    console.error('[API] Process payment error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
