import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number is too long')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email is too long');

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const datetimeSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format' });

export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// ============================================
// Service Schemas
// ============================================

export const serviceIdSchema = z
  .string()
  .min(1, 'Service ID is required');

export const serviceSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  description: z.string(),
  durationMinutes: z.number().positive(),
  priceCents: z.number().nonnegative(),
  isActive: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

// ============================================
// Booking Schemas
// ============================================

export const createBookingSchema = z.object({
  serviceId: serviceIdSchema,
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  appointmentDatetime: datetimeSchema,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  appointmentDatetime: datetimeSchema.optional(),
  notes: z.string().max(500).optional(),
  calendarEventId: z.string().optional(),
  paymentId: z.string().optional(),
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ============================================
// Availability Schemas
// ============================================

export const availabilityQuerySchema = z.object({
  serviceId: serviceIdSchema,
  date: dateSchema,
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const timeSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  displayTime: z.string(),
  available: z.boolean(),
});

export type TimeSlotInput = z.infer<typeof timeSlotSchema>;

// ============================================
// Payment Schemas
// ============================================

export const processPaymentSchema = z.object({
  bookingId: uuidSchema,
  sourceId: z.string().min(1, 'Payment source is required'),
  amountCents: z.number().positive('Amount must be positive'),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;

export const paymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// ============================================
// Webhook Schemas
// ============================================

export const squareWebhookEventSchema = z.object({
  merchant_id: z.string(),
  type: z.string(),
  event_id: z.string(),
  created_at: z.string(),
  data: z.object({
    type: z.string(),
    id: z.string(),
    object: z.record(z.unknown()),
  }),
});

export type SquareWebhookEvent = z.infer<typeof squareWebhookEventSchema>;

// ============================================
// API Response Schemas
// ============================================

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// ============================================
// Validation Helpers
// ============================================

/**
 * Safely parse and validate data against a schema.
 * Returns the parsed data or throws a formatted error.
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    const errorMessage = errors.map(e => `${e.path}: ${e.message}`).join(', ');
    throw new ValidationError(errorMessage, errors);
  }

  return result.data;
}

/**
 * Custom validation error class with detailed field errors.
 */
export class ValidationError extends Error {
  public readonly errors: Array<{ path: string; message: string }>;

  constructor(message: string, errors: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Format Zod errors into a user-friendly object.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = err.message;
    }
  });

  return formatted;
}
