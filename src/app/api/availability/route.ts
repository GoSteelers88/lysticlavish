import { NextRequest, NextResponse } from 'next/server';
import { parse, isValid, isBefore, startOfDay, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getAvailableSlots, getAvailableDates } from '@/lib/availability/slots';
import { getServiceById } from '@/lib/google/sheets';
import { getBusinessTimezone } from '@/lib/google/calendar';
import { availabilityQuerySchema, validateData, ValidationError } from '@/lib/validation/schemas';

/**
 * GET /api/availability
 * Get available time slots for a service on a specific date.
 *
 * Query params:
 * - serviceId: ID of the service (required)
 * - date: Date in YYYY-MM-DD format (required)
 *
 * Returns:
 * - slots: Array of time slots with availability status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const dateStr = searchParams.get('date');

    // Validate query parameters
    const query = validateData(availabilityQuerySchema, {
      serviceId,
      date: dateStr,
    });

    // Fetch service to get duration
    const service = await getServiceById(query.serviceId);

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Parse and validate date
    const timezone = getBusinessTimezone();
    const date = parse(query.date, 'yyyy-MM-dd', new Date());

    if (!isValid(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if date is in the past
    const today = startOfDay(toZonedTime(new Date(), timezone));
    if (isBefore(date, today)) {
      return NextResponse.json(
        { success: false, error: 'Cannot book appointments in the past' },
        { status: 400 }
      );
    }

    // Check if date is within booking window
    const maxDate = addDays(today, parseInt(process.env.BOOKING_WINDOW_DAYS || '60', 10));
    if (isBefore(maxDate, date)) {
      return NextResponse.json(
        { success: false, error: 'Date is outside the booking window' },
        { status: 400 }
      );
    }

    // Get available slots
    const slots = await getAvailableSlots(date, service.durationMinutes);

    return NextResponse.json({
      success: true,
      data: {
        date: query.date,
        service: {
          id: service.id,
          name: service.name,
          duration: service.durationMinutes,
        },
        slots,
        timezone,
      },
    });
  } catch (error) {
    console.error('[API] Availability error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/availability/dates
 * Get available dates for booking within the booking window.
 * This endpoint is available at /api/availability?type=dates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      );
    }

    // Fetch service to get duration
    const service = await getServiceById(serviceId);

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get available dates
    const dates = await getAvailableDates(service.durationMinutes);

    return NextResponse.json({
      success: true,
      data: {
        dates,
        service: {
          id: service.id,
          name: service.name,
          duration: service.durationMinutes,
        },
      },
    });
  } catch (error) {
    console.error('[API] Available dates error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch available dates' },
      { status: 500 }
    );
  }
}
