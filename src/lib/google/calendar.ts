import { google, calendar_v3 } from 'googleapis';
import { getGoogleAuth, CALENDAR_SCOPES } from './auth';
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  status: string;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
  attendeeName?: string;
}

/**
 * Get the Google Calendar client
 */
function getCalendarClient(): calendar_v3.Calendar {
  const auth = getGoogleAuth(CALENDAR_SCOPES);
  return google.calendar({ version: 'v3', auth });
}

/**
 * Get the configured calendar ID
 */
function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID environment variable is not set');
  }
  return calendarId;
}

/**
 * Get the business timezone
 */
export function getBusinessTimezone(): string {
  return process.env.BUSINESS_TIMEZONE || 'America/New_York';
}

/**
 * Fetch all events for a given date range from the calendar.
 * Returns events that might conflict with new appointments.
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const timezone = getBusinessTimezone();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: timezone,
    });

    const events = response.data.items || [];

    return events
      .filter((event) => event.status !== 'cancelled')
      .map((event) => ({
        id: event.id || '',
        summary: event.summary || '',
        description: event.description || undefined,
        start: event.start?.dateTime
          ? new Date(event.start.dateTime)
          : new Date(event.start?.date || ''),
        end: event.end?.dateTime
          ? new Date(event.end.dateTime)
          : new Date(event.end?.date || ''),
        status: event.status || 'confirmed',
      }));
  } catch (error) {
    console.error('[Calendar] Error fetching events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

/**
 * Check if a specific time slot conflicts with existing calendar events.
 * Includes buffer time consideration.
 */
export async function checkTimeSlotAvailability(
  startTime: Date,
  endTime: Date,
  bufferMinutes: number = 0
): Promise<boolean> {
  // Expand the check window by buffer time
  const checkStart = new Date(startTime.getTime() - bufferMinutes * 60 * 1000);
  const checkEnd = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);

  const events = await getCalendarEvents(checkStart, checkEnd);

  // Check for any overlapping events
  for (const event of events) {
    const eventStart = event.start.getTime();
    const eventEnd = event.end.getTime();
    const slotStart = startTime.getTime();
    const slotEnd = endTime.getTime();

    // Check if there's any overlap
    if (slotStart < eventEnd && slotEnd > eventStart) {
      return false; // Conflict found
    }
  }

  return true; // No conflicts
}

/**
 * Create a calendar event for a confirmed booking.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<string> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const timezone = getBusinessTimezone();

  const eventData: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: timezone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };

  // Add attendee if email provided
  if (params.attendeeEmail) {
    eventData.attendees = [
      {
        email: params.attendeeEmail,
        displayName: params.attendeeName,
        responseStatus: 'accepted',
      },
    ];
    // Send notifications to attendees
    eventData.guestsCanModify = false;
    eventData.guestsCanInviteOthers = false;
  }

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData,
      sendUpdates: params.attendeeEmail ? 'all' : 'none',
    });

    const eventId = response.data.id;
    if (!eventId) {
      throw new Error('No event ID returned from calendar');
    }

    console.log(`[Calendar] Created event: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error('[Calendar] Error creating event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Update an existing calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  params: Partial<CreateEventParams>
): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const timezone = getBusinessTimezone();

  const updateData: calendar_v3.Schema$Event = {};

  if (params.summary) {
    updateData.summary = params.summary;
  }
  if (params.description !== undefined) {
    updateData.description = params.description;
  }
  if (params.startTime) {
    updateData.start = {
      dateTime: params.startTime.toISOString(),
      timeZone: timezone,
    };
  }
  if (params.endTime) {
    updateData.end = {
      dateTime: params.endTime.toISOString(),
      timeZone: timezone,
    };
  }

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
    });
    console.log(`[Calendar] Updated event: ${eventId}`);
  } catch (error) {
    console.error('[Calendar] Error updating event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Cancel (delete) a calendar event.
 */
export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });
    console.log(`[Calendar] Cancelled event: ${eventId}`);
  } catch (error) {
    console.error('[Calendar] Error cancelling event:', error);
    throw new Error('Failed to cancel calendar event');
  }
}

/**
 * Get events for a specific date (in business timezone).
 */
export async function getEventsForDate(date: Date): Promise<CalendarEvent[]> {
  const timezone = getBusinessTimezone();

  // Convert to business timezone
  const zonedDate = toZonedTime(date, timezone);

  // Get start of day (midnight) in business timezone
  const startOfDay = new Date(zonedDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Get end of day (23:59:59) in business timezone
  const endOfDay = new Date(zonedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Convert back to UTC for API call
  const startUTC = fromZonedTime(startOfDay, timezone);
  const endUTC = fromZonedTime(endOfDay, timezone);

  return getCalendarEvents(startUTC, endUTC);
}
