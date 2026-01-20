import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/square/client';
import {
  updatePaymentBySquareId,
  getPaymentBySquareId,
  updateBooking,
  getBookingById,
} from '@/lib/google/sheets';
import { cancelCalendarEvent } from '@/lib/google/calendar';

/**
 * POST /api/payments/square/webhook
 * Handle Square webhook events.
 *
 * Verified events:
 * - payment.completed: Update payment and booking status
 * - payment.failed: Update payment status, mark booking as pending
 * - payment.updated: Handle payment updates
 * - refund.created: Handle refunds
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature header
    const signature = request.headers.get('x-square-hmacsha256-signature');

    if (!signature) {
      console.warn('[Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get the webhook URL for verification
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/payments/square/webhook`;

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookUrl);

    if (!isValid) {
      console.warn('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const eventData = event.data?.object;

    console.log(`[Webhook] Received event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(eventData?.payment);
        break;

      case 'payment.failed':
        await handlePaymentFailed(eventData?.payment);
        break;

      case 'payment.updated':
        await handlePaymentUpdated(eventData?.payment);
        break;

      case 'refund.created':
      case 'refund.updated':
        await handleRefund(eventData?.refund);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);

    // Still return 200 to prevent retries for parsing errors
    // Square will retry on 4xx/5xx
    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    );
  }
}

/**
 * Handle payment.completed event.
 */
async function handlePaymentCompleted(payment: {
  id?: string;
  status?: string;
  reference_id?: string;
}) {
  if (!payment?.id) {
    console.warn('[Webhook] Payment completed event missing payment ID');
    return;
  }

  console.log(`[Webhook] Payment completed: ${payment.id}`);

  // Update payment record
  const existingPayment = await getPaymentBySquareId(payment.id);

  if (existingPayment) {
    await updatePaymentBySquareId(payment.id, {
      status: 'completed',
    });

    // Update booking if needed
    if (existingPayment.bookingId) {
      const booking = await getBookingById(existingPayment.bookingId);
      if (booking && booking.status === 'pending') {
        await updateBooking(existingPayment.bookingId, {
          status: 'confirmed',
        });
        console.log(`[Webhook] Booking confirmed: ${existingPayment.bookingId}`);
      }
    }
  } else {
    console.log(`[Webhook] No payment record found for: ${payment.id}`);
  }
}

/**
 * Handle payment.failed event.
 */
async function handlePaymentFailed(payment: {
  id?: string;
  status?: string;
  reference_id?: string;
}) {
  if (!payment?.id) {
    console.warn('[Webhook] Payment failed event missing payment ID');
    return;
  }

  console.log(`[Webhook] Payment failed: ${payment.id}`);

  // Update payment record
  const existingPayment = await getPaymentBySquareId(payment.id);

  if (existingPayment) {
    await updatePaymentBySquareId(payment.id, {
      status: 'failed',
    });

    // Keep booking as pending so customer can retry
    console.log(`[Webhook] Payment marked as failed: ${payment.id}`);
  }
}

/**
 * Handle payment.updated event.
 */
async function handlePaymentUpdated(payment: {
  id?: string;
  status?: string;
}) {
  if (!payment?.id) {
    console.warn('[Webhook] Payment updated event missing payment ID');
    return;
  }

  console.log(`[Webhook] Payment updated: ${payment.id}, status: ${payment.status}`);

  // Map Square status to our status
  const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
    APPROVED: 'pending',
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELED: 'failed',
    FAILED: 'failed',
  };

  const newStatus = payment.status ? statusMap[payment.status] : undefined;

  if (newStatus) {
    await updatePaymentBySquareId(payment.id, { status: newStatus });
  }
}

/**
 * Handle refund events.
 */
async function handleRefund(refund: {
  id?: string;
  payment_id?: string;
  status?: string;
  amount_money?: { amount?: number };
}) {
  if (!refund?.payment_id) {
    console.warn('[Webhook] Refund event missing payment ID');
    return;
  }

  console.log(`[Webhook] Refund for payment: ${refund.payment_id}, status: ${refund.status}`);

  // Update payment status to refunded
  const existingPayment = await getPaymentBySquareId(refund.payment_id);

  if (existingPayment && refund.status === 'COMPLETED') {
    await updatePaymentBySquareId(refund.payment_id, {
      status: 'refunded',
    });

    // Cancel booking and calendar event
    if (existingPayment.bookingId) {
      const booking = await getBookingById(existingPayment.bookingId);

      if (booking) {
        // Cancel calendar event if exists
        if (booking.calendarEventId) {
          try {
            await cancelCalendarEvent(booking.calendarEventId);
            console.log(`[Webhook] Calendar event cancelled: ${booking.calendarEventId}`);
          } catch (error) {
            console.error('[Webhook] Failed to cancel calendar event:', error);
          }
        }

        // Update booking status
        await updateBooking(existingPayment.bookingId, {
          status: 'cancelled',
        });
        console.log(`[Webhook] Booking cancelled due to refund: ${existingPayment.bookingId}`);
      }
    }
  }
}
