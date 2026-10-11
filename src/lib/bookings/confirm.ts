import { addMinutes } from 'date-fns';
import {
  getBookingById,
  getPaymentsByBookingId,
  updateBooking,
  type Booking,
  type Payment,
} from '@/lib/google/sheets';
import { createCalendarEvent } from '@/lib/google/calendar';
import { sendCustomerConfirmation, sendBusinessNotification } from '@/lib/email';
import servicesData from '@/data/services.json';

type ServiceRecord = (typeof servicesData.services)[number];

export interface BookingServices {
  services: ServiceRecord[];
  serviceNames: string[];
  totalPriceCents: number;
  totalDurationMinutes: number;
}

/** Internal marker for multi-service bookings, written at the start of notes. */
const SERVICE_IDS_PREFIX = /^\[sids:([^\]]+)\]\n?/;

/** Customer notes with the internal service marker removed. */
export function stripServicePrefix(notes: string | null | undefined): string {
  return (notes ?? '').replace(SERVICE_IDS_PREFIX, '');
}

/**
 * Resolve every service on a booking from the booking row itself. Extra
 * services live in a `[sids:a,b,c]` prefix on notes that only the server
 * writes, and it always starts with the booking's own `serviceId` — a prefix
 * that doesn't is customer text and is ignored. Returns null if any service
 * is unknown or inactive.
 */
export function resolveBookingServices(booking: Booking): BookingServices | null {
  let serviceIds = [booking.serviceId];
  const notesMatch = booking.notes?.match(SERVICE_IDS_PREFIX);
  if (notesMatch) {
    const prefixIds = notesMatch[1].split(',');
    if (prefixIds[0] === booking.serviceId) {
      serviceIds = prefixIds;
    } else {
      console.warn(
        `[API] Booking ${booking.id}: ignoring service prefix that doesn't start with ${booking.serviceId}`
      );
    }
  }

  const serviceRaws = serviceIds.map((id) =>
    servicesData.services.find((s) => s.id === id && s.is_active)
  );
  if (serviceRaws.some((s) => !s)) {
    return null;
  }
  const services = serviceRaws as ServiceRecord[];

  return {
    services,
    serviceNames: services.map((s) => s.name),
    totalPriceCents: services.reduce((sum, s) => sum + s.price_cents, 0),
    totalDurationMinutes: services.reduce((sum, s) => sum + s.duration_minutes, 0),
  };
}

/**
 * One booking, one payment. Sheets can't lock a row, so both payment routes
 * claim a booking by "write your row, then look": record your own payment row
 * BEFORE charging, then call this. Two simultaneous attempts can't both see
 * only themselves — the later writer always sees the earlier row — so at most
 * one goes ahead. (Both may back off; neither can double-charge.)
 */
export async function findOtherActivePayment(
  bookingId: string,
  ownPaymentRowId: string
): Promise<Payment | null> {
  const rows = await getPaymentsByBookingId(bookingId);
  return rows.find((p) => p.id !== ownPaymentRowId && p.status !== 'failed') ?? null;
}

export interface ConfirmPaidBookingParams {
  booking: Booking;
  bookingServices: BookingServices;
  payment: Payment;
  amountPaidCents: number;
  paymentMethod: 'card_deposit' | 'affirm';
}

/**
 * Everything that happens once a booking is paid: create the calendar event,
 * mark the booking confirmed, and email the customer and the business.
 *
 * Safe to call again for the same booking (a retry, or two overlapping
 * requests): it re-reads the booking, does nothing if it's already confirmed,
 * and never creates a second calendar event.
 * Calendar and email failures are logged, never thrown — the money is taken.
 */
export async function confirmPaidBooking({
  booking: bookingSnapshot,
  bookingServices,
  payment,
  amountPaidCents,
  paymentMethod,
}: ConfirmPaidBookingParams): Promise<{
  confirmedBooking: Booking | null;
  calendarEventId: string | null;
}> {
  const { serviceNames, totalPriceCents, totalDurationMinutes } = bookingServices;

  const booking = (await getBookingById(bookingSnapshot.id)) ?? bookingSnapshot;
  if (booking.status === 'confirmed') {
    console.log(`[API] Booking already confirmed, skipping: ${booking.id}`);
    return { confirmedBooking: booking, calendarEventId: booking.calendarEventId };
  }

  const userNotes = stripServicePrefix(booking.notes) || undefined;

  // Create calendar event (unless an earlier attempt already did)
  let calendarEventId: string | null = booking.calendarEventId;
  if (!calendarEventId) {
    const appointmentStart = new Date(booking.appointmentDatetime);
    const appointmentEnd = addMinutes(appointmentStart, totalDurationMinutes);

    try {
      calendarEventId = await createCalendarEvent({
        summary: `${serviceNames.join(' + ')} - ${booking.customerName}`,
        description: [
          `Service: ${serviceNames.join(', ')}`,
          `Client: ${booking.customerName}`,
          `Email: ${booking.customerEmail}`,
          `Phone: ${booking.customerPhone}`,
          userNotes ? `Notes: ${userNotes}` : '',
          paymentMethod === 'affirm' ? 'Payment: Paid in full with Affirm' : '',
          `Booking ID: ${booking.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
        location: '213 Damsenberry Way, China Grove, NC 28023',
        startTime: appointmentStart,
        endTime: appointmentEnd,
      });

      // Save the event right away so a retry after a later failure reuses it
      await updateBooking(booking.id, { calendarEventId });
    } catch (calendarError) {
      // Log but don't fail the payment
      console.error('[API] Failed to create calendar event:', calendarError);
    }
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
    await Promise.all([
      sendCustomerConfirmation({
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceNames,
        appointmentDatetime: booking.appointmentDatetime,
        durationMinutes: totalDurationMinutes,
        totalPriceCents,
        depositPaidCents: amountPaidCents,
        bookingId: booking.id,
        paymentMethod,
      }),
      sendBusinessNotification({
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceNames,
        appointmentDatetime: booking.appointmentDatetime,
        durationMinutes: totalDurationMinutes,
        depositPaidCents: amountPaidCents,
        notes: userNotes,
        bookingId: booking.id,
        paymentMethod,
      }),
    ]);
  } catch (emailError) {
    console.error('[API] Failed to send confirmation emails:', emailError);
  }

  return { confirmedBooking, calendarEventId };
}
