import { addMinutes, format, parse, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getCalendarEvents, getBusinessTimezone, CalendarEvent } from '../google/calendar';
import { getBookingsForDate } from '../google/sheets';

// ============================================
// Types
// ============================================

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  displayTime: string; // Formatted for display (e.g., "10:00 AM")
  available: boolean;
}

export interface BusinessHours {
  open: string; // "HH:MM" format
  close: string; // "HH:MM" format
}

export interface DaySchedule {
  [key: string]: BusinessHours | null; // null = closed
}

// ============================================
// Configuration
// ============================================

function getBusinessHours(): DaySchedule {
  const hoursJson = process.env.BUSINESS_HOURS_JSON;
  if (!hoursJson) {
    // Default business hours
    return {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '19:00' },
      saturday: { open: '10:00', close: '17:00' },
      sunday: null,
    };
  }

  try {
    return JSON.parse(hoursJson);
  } catch {
    console.error('[Availability] Failed to parse BUSINESS_HOURS_JSON');
    throw new Error('Invalid business hours configuration');
  }
}

function getBufferMinutes(): number {
  return parseInt(process.env.APPOINTMENT_BUFFER_MINUTES || '15', 10);
}

function getSlotInterval(): number {
  return parseInt(process.env.SLOT_INTERVAL_MINUTES || '30', 10);
}

function getBookingWindowDays(): number {
  return parseInt(process.env.BOOKING_WINDOW_DAYS || '60', 10);
}

// ============================================
// Slot Generation
// ============================================

/**
 * Get the day of week key for business hours lookup.
 */
function getDayKey(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Generate all possible time slots for a given date and service duration.
 */
function generateBaseSlots(
  date: Date,
  serviceDurationMinutes: number,
  timezone: string
): TimeSlot[] {
  const businessHours = getBusinessHours();
  const slotInterval = getSlotInterval();
  const dayKey = getDayKey(date);
  const dayHours = businessHours[dayKey];

  // Business is closed on this day
  if (!dayHours) {
    return [];
  }

  const slots: TimeSlot[] = [];

  // Parse business hours
  const [openHour, openMinute] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

  // Create start and end times in business timezone
  const dateStr = format(date, 'yyyy-MM-dd');

  let currentTime = parse(`${dateStr} ${dayHours.open}`, 'yyyy-MM-dd HH:mm', new Date());
  const closeTime = parse(`${dateStr} ${dayHours.close}`, 'yyyy-MM-dd HH:mm', new Date());

  // Generate slots at regular intervals
  while (true) {
    const slotEnd = addMinutes(currentTime, serviceDurationMinutes);

    // Stop if slot would end after closing time
    if (isAfter(slotEnd, closeTime)) {
      break;
    }

    // Convert to UTC for storage
    const startUTC = fromZonedTime(currentTime, timezone);
    const endUTC = fromZonedTime(slotEnd, timezone);

    slots.push({
      startTime: startUTC.toISOString(),
      endTime: endUTC.toISOString(),
      displayTime: format(currentTime, 'h:mm a'),
      available: true,
    });

    // Move to next slot
    currentTime = addMinutes(currentTime, slotInterval);
  }

  return slots;
}

/**
 * Check if a time slot conflicts with an event.
 */
function slotConflictsWithEvent(
  slotStart: Date,
  slotEnd: Date,
  event: CalendarEvent,
  bufferMinutes: number
): boolean {
  // Add buffer to the slot time
  const bufferedStart = addMinutes(slotStart, -bufferMinutes);
  const bufferedEnd = addMinutes(slotEnd, bufferMinutes);

  const eventStart = event.start.getTime();
  const eventEnd = event.end.getTime();
  const slotStartTime = bufferedStart.getTime();
  const slotEndTime = bufferedEnd.getTime();

  // Check for any overlap
  return slotStartTime < eventEnd && slotEndTime > eventStart;
}

/**
 * Get available time slots for a specific date and service.
 */
export async function getAvailableSlots(
  date: Date,
  serviceDurationMinutes: number
): Promise<TimeSlot[]> {
  const timezone = getBusinessTimezone();
  const bufferMinutes = getBufferMinutes();

  // Generate base slots for the day
  const slots = generateBaseSlots(date, serviceDurationMinutes, timezone);

  if (slots.length === 0) {
    return [];
  }

  // Get start and end of day in UTC
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayStart = fromZonedTime(parse(`${dateStr} 00:00`, 'yyyy-MM-dd HH:mm', new Date()), timezone);
  const dayEnd = fromZonedTime(parse(`${dateStr} 23:59`, 'yyyy-MM-dd HH:mm', new Date()), timezone);

  // Fetch calendar events and bookings for this date
  const [calendarEvents, bookings] = await Promise.all([
    getCalendarEvents(dayStart, dayEnd),
    getBookingsForDate(dateStr),
  ]);

  // Convert bookings to event-like format for conflict checking
  const bookingEvents: CalendarEvent[] = bookings
    .filter(b => b.status !== 'cancelled')
    .map(booking => ({
      id: booking.id,
      summary: 'Booking',
      start: new Date(booking.appointmentDatetime),
      end: addMinutes(new Date(booking.appointmentDatetime), serviceDurationMinutes),
      status: 'confirmed',
    }));

  // Combine all events
  const allEvents = [...calendarEvents, ...bookingEvents];

  // Check current time - don't show slots in the past
  const now = new Date();

  // Mark unavailable slots
  return slots.map(slot => {
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);

    // Check if slot is in the past
    if (isBefore(slotStart, now)) {
      return { ...slot, available: false };
    }

    // Check for conflicts with events
    const hasConflict = allEvents.some(event =>
      slotConflictsWithEvent(slotStart, slotEnd, event, bufferMinutes)
    );

    return { ...slot, available: !hasConflict };
  });
}

/**
 * Get available dates for booking within the booking window.
 */
export async function getAvailableDates(serviceDurationMinutes: number): Promise<string[]> {
  const timezone = getBusinessTimezone();
  const windowDays = getBookingWindowDays();
  const businessHours = getBusinessHours();

  const availableDates: string[] = [];
  const today = startOfDay(toZonedTime(new Date(), timezone));

  for (let i = 0; i < windowDays; i++) {
    const date = addDays(today, i);
    const dayKey = getDayKey(date);

    // Check if business is open on this day
    if (businessHours[dayKey]) {
      availableDates.push(format(date, 'yyyy-MM-dd'));
    }
  }

  return availableDates;
}

/**
 * Validate that a specific slot is still available.
 * Used before finalizing a booking.
 */
export async function validateSlotAvailability(
  startTime: Date,
  serviceDurationMinutes: number
): Promise<boolean> {
  const timezone = getBusinessTimezone();
  const bufferMinutes = getBufferMinutes();
  const businessHours = getBusinessHours();

  // Check if in the past
  if (isBefore(startTime, new Date())) {
    return false;
  }

  // Check business hours
  const zonedTime = toZonedTime(startTime, timezone);
  const dayKey = getDayKey(zonedTime);
  const dayHours = businessHours[dayKey];

  if (!dayHours) {
    return false; // Business is closed
  }

  // Check if within business hours
  const timeStr = format(zonedTime, 'HH:mm');
  const endTime = addMinutes(startTime, serviceDurationMinutes);
  const endTimeStr = format(toZonedTime(endTime, timezone), 'HH:mm');

  if (timeStr < dayHours.open || endTimeStr > dayHours.close) {
    return false;
  }

  // Check for conflicts
  const dateStr = format(zonedTime, 'yyyy-MM-dd');
  const dayStart = fromZonedTime(parse(`${dateStr} 00:00`, 'yyyy-MM-dd HH:mm', new Date()), timezone);
  const dayEnd = fromZonedTime(parse(`${dateStr} 23:59`, 'yyyy-MM-dd HH:mm', new Date()), timezone);

  const [calendarEvents, bookings] = await Promise.all([
    getCalendarEvents(dayStart, dayEnd),
    getBookingsForDate(dateStr),
  ]);

  // Check calendar conflicts
  for (const event of calendarEvents) {
    if (slotConflictsWithEvent(startTime, endTime, event, bufferMinutes)) {
      return false;
    }
  }

  // Check booking conflicts
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;

    const bookingStart = new Date(booking.appointmentDatetime);
    const bookingEnd = addMinutes(bookingStart, serviceDurationMinutes);
    const bookingEvent: CalendarEvent = {
      id: booking.id,
      summary: 'Booking',
      start: bookingStart,
      end: bookingEnd,
      status: 'confirmed',
    };

    if (slotConflictsWithEvent(startTime, endTime, bookingEvent, bufferMinutes)) {
      return false;
    }
  }

  return true;
}
