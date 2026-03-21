import { NextRequest, NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import { processPayment, getClientConfig } from '@/lib/square/client';
import {
  getBookingById,
  updateBooking,
  createPayment,
} from '@/lib/google/sheets';
import { createCalendarEvent } from '@/lib/google/calendar';
import {
  processPaymentSchema,
  validateData,
  ValidationError,
} from '@/lib/validation/schemas';
import { sendCustomerConfirmation, sendBusinessNotification } from '@/lib/email';
import servicesData from '@/data/services.json';

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

    // Resolve all service IDs — from request body if provided, else decode from booking notes
    let serviceIds: string[] = data.serviceIds ?? [];
    if (serviceIds.length === 0) {
      const notesMatch = booking.notes?.match(/^\[sids:([^\]]+)\]/);
      serviceIds = notesMatch ? notesMatch[1].split(',') : [booking.serviceId];
    }

    const serviceRaws = serviceIds.map((id) =>
      servicesData.services.find((s) => s.id === id && s.is_active)
    );
    if (serviceRaws.some((s) => !s)) {
      return NextResponse.json(
        { success: false, error: 'One or more services not found' },
        { status: 404 }
      );
    }
    const resolvedServices = serviceRaws as NonNullable<(typeof serviceRaws)[0]>[];

    const totalPriceCents = resolvedServices.reduce((sum, s) => sum + s.price_cents, 0);
    const totalDurationMinutes = resolvedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
    const serviceNames = resolvedServices.map((s) => s.name);
    const primaryService = resolvedServices[0];

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

    const service = {
      name: primaryService.name,
      priceCents: totalPriceCents,
      durationMinutes: totalDurationMinutes,
    };

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
        summary: `${serviceNames.join(' + ')} - ${booking.customerName}`,
        description: [
          `Service: ${serviceNames.join(', ')}`,
          `Client: ${booking.customerName}`,
          `Email: ${booking.customerEmail}`,
          `Phone: ${booking.customerPhone}`,
          booking.notes ? `Notes: ${booking.notes}` : '',
          `Booking ID: ${booking.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
        location: '213 Damsenberry Way, China Grove, NC 28023',
        startTime: appointmentStart,
        endTime: appointmentEnd,
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

    // Send confirmation emails
    try {
      // Strip internal service prefix from notes before emailing
      const userNotes = booking.notes?.replace(/^\[sids:[^\]]+\]\n?/, '') || undefined;

      await Promise.all([
        sendCustomerConfirmation({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          serviceNames,
          appointmentDatetime: booking.appointmentDatetime,
          durationMinutes: service.durationMinutes,
          totalPriceCents: service.priceCents,
          depositPaidCents: data.amountCents,
          bookingId: booking.id,
        }),
        sendBusinessNotification({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          serviceNames,
          appointmentDatetime: booking.appointmentDatetime,
          durationMinutes: service.durationMinutes,
          depositPaidCents: data.amountCents,
          notes: userNotes,
          bookingId: booking.id,
        }),
      ]);
    } catch (emailError) {
      console.error('[API] Failed to send confirmation emails:', emailError);
    }

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
