import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  getBookingById,
  updateBooking,
  getServiceById,
} from '@/lib/google/sheets';
import { validateSlotAvailability } from '@/lib/availability/slots';
import {
  createBookingSchema,
  updateBookingSchema,
  validateData,
  ValidationError,
} from '@/lib/validation/schemas';

/**
 * GET /api/bookings
 * Get booking details by ID.
 *
 * Query params:
 * - id: Booking ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const booking = await getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get service details
    const service = await getServiceById(booking.serviceId);

    return NextResponse.json({
      success: true,
      data: {
        booking,
        service,
      },
    });
  } catch (error) {
    console.error('[API] Get booking error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Create a new pending booking.
 *
 * Body:
 * - serviceId: ID of the service
 * - customerName: Customer's full name
 * - customerEmail: Customer's email
 * - customerPhone: Customer's phone number
 * - appointmentDatetime: ISO datetime string
 * - notes: Optional notes
 *
 * Flow:
 * 1. Validate input
 * 2. Verify service exists
 * 3. Check slot availability
 * 4. Create pending booking
 * 5. Return booking for payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const data = validateData(createBookingSchema, body);

    // Look up all selected services
    const services = await Promise.all(data.serviceIds.map((id) => getServiceById(id)));
    const missingService = services.findIndex((s) => !s);
    if (missingService !== -1) {
      return NextResponse.json(
        { success: false, error: `Service not found: ${data.serviceIds[missingService]}` },
        { status: 404 }
      );
    }
    const validServices = services as NonNullable<(typeof services)[0]>[];
    const primaryService = validServices[0];
    const totalDurationMinutes = validServices.reduce((sum, s) => sum + s.durationMinutes, 0);

    // Validate slot availability using total duration
    const appointmentTime = new Date(data.appointmentDatetime);
    const isAvailable = await validateSlotAvailability(appointmentTime, totalDurationMinutes);

    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected time slot is no longer available. Please choose another time.',
        },
        { status: 409 }
      );
    }

    // Encode all service IDs into notes if multiple selected
    const servicePrefix =
      data.serviceIds.length > 1 ? `[sids:${data.serviceIds.join(',')}]\n` : '';
    const notes = servicePrefix + (data.notes || '');

    // Create pending booking (primary service stored in serviceId column)
    const booking = await createBooking({
      serviceId: primaryService.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      appointmentDatetime: data.appointmentDatetime,
      notes: notes || undefined,
    });

    console.log(`[API] Created pending booking: ${booking.id}`);

    return NextResponse.json({
      success: true,
      data: {
        booking,
        service: {
          id: primaryService.id,
          name: primaryService.name,
          duration: totalDurationMinutes,
          price: validServices.reduce((sum, s) => sum + s.priceCents, 0),
        },
      },
    });
  } catch (error) {
    console.error('[API] Create booking error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings
 * Update an existing booking.
 *
 * Query params:
 * - id: Booking ID (required)
 *
 * Body:
 * - status: New status
 * - appointmentDatetime: New datetime
 * - notes: Updated notes
 * - calendarEventId: Calendar event ID
 * - paymentId: Payment ID
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate update data
    const updates = validateData(updateBookingSchema, body);

    // Check booking exists
    const existingBooking = await getBookingById(bookingId);
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // If updating datetime, validate availability
    if (updates.appointmentDatetime) {
      const service = await getServiceById(existingBooking.serviceId);
      if (service) {
        const isAvailable = await validateSlotAvailability(
          new Date(updates.appointmentDatetime),
          service.durationMinutes
        );

        if (!isAvailable) {
          return NextResponse.json(
            { success: false, error: 'The selected time slot is not available' },
            { status: 409 }
          );
        }
      }
    }

    // Update booking
    const updatedBooking = await updateBooking(bookingId, updates);

    console.log(`[API] Updated booking: ${bookingId}`);

    return NextResponse.json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    console.error('[API] Update booking error:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
