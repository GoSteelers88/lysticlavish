import { NextRequest, NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import { processPayment, getClientConfig } from '@/lib/square/client';
import {
  getBookingById,
  updateBooking,
  createPayment,
  getServiceById,
} from '@/lib/google/sheets';
import { createCalendarEvent } from '@/lib/google/calendar';
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

    // Get service
    const service = await getServiceById(booking.serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Verify amount matches service price
    if (data.amountCents !== service.priceCents) {
      console.warn(
        `[API] Amount mismatch: expected ${service.priceCents}, got ${data.amountCents}`
      );
      return NextResponse.json(
        { success: false, error: 'Payment amount does not match service price' },
        { status: 400 }
      );
    }

    // Process payment with Square
    const paymentResult = await processPayment({
      sourceId: data.sourceId,
      amountCents: data.amountCents,
      note: `Lystic Lavish - ${service.name} for ${booking.customerName}`,
      referenceId: booking.id,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      console.error('[API] Payment failed:', paymentResult.error);

      // Create failed payment record
      await createPayment({
        bookingId: booking.id,
        squarePaymentId: paymentResult.paymentId || 'failed',
        amountCents: data.amountCents,
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

    // Create payment record
    const payment = await createPayment({
      bookingId: booking.id,
      squarePaymentId: paymentResult.paymentId,
      amountCents: data.amountCents,
      status: 'completed',
      paymentMethod: paymentResult.cardBrand || 'card',
    });

    // Create calendar event
    const appointmentStart = new Date(booking.appointmentDatetime);
    const appointmentEnd = addMinutes(appointmentStart, service.durationMinutes);

    let calendarEventId: string | null = null;
    try {
      calendarEventId = await createCalendarEvent({
        summary: `${service.name} - ${booking.customerName}`,
        description: [
          `Service: ${service.name}`,
          `Client: ${booking.customerName}`,
          `Email: ${booking.customerEmail}`,
          `Phone: ${booking.customerPhone}`,
          booking.notes ? `Notes: ${booking.notes}` : '',
          `Booking ID: ${booking.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
        startTime: appointmentStart,
        endTime: appointmentEnd,
        attendeeEmail: booking.customerEmail,
        attendeeName: booking.customerName,
      });
    } catch (calendarError) {
      // Log but don't fail the payment
      console.error('[API] Failed to create calendar event:', calendarError);
    }

    // Update booking to confirmed
    const confirmedBooking = await updateBooking(booking.id, {
      status: 'confirmed',
      paymentId: payment.id,
      calendarEventId,
    });

    console.log(`[API] Booking confirmed: ${booking.id}`);

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
