import { google, sheets_v4 } from 'googleapis';
import { getGoogleAuth, SHEETS_SCOPES } from './auth';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Types
// ============================================

export interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDatetime: string; // ISO string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  calendarEventId: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  squarePaymentId: string;
  amountCents: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Sheets Client
// ============================================

function getSheetsClient(): sheets_v4.Sheets {
  const auth = getGoogleAuth(SHEETS_SCOPES);
  return google.sheets({ version: 'v4', auth });
}

function getSheetId(sheetType: 'services' | 'bookings' | 'payments'): string {
  const envVar = {
    services: 'GOOGLE_SHEETS_ID_SERVICES',
    bookings: 'GOOGLE_SHEETS_ID_BOOKINGS',
    payments: 'GOOGLE_SHEETS_ID_PAYMENTS',
  }[sheetType];

  const sheetId = process.env[envVar];
  if (!sheetId) {
    throw new Error(`${envVar} environment variable is not set`);
  }
  return sheetId;
}

// ============================================
// Generic Sheet Operations
// ============================================

async function getSheetData(sheetId: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return (response.data.values || []) as string[][];
  } catch (error) {
    console.error('[Sheets] Error reading data:', error);
    throw new Error('Failed to read from Google Sheets');
  }
}

async function appendSheetRow(sheetId: string, range: string, values: (string | number | boolean)[]): Promise<void> {
  const sheets = getSheetsClient();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values.map(v => v?.toString() ?? '')],
      },
    });
  } catch (error) {
    console.error('[Sheets] Error appending row:', error);
    throw new Error('Failed to append to Google Sheets');
  }
}

async function updateSheetRow(
  sheetId: string,
  range: string,
  values: (string | number | boolean | null)[]
): Promise<void> {
  const sheets = getSheetsClient();

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values.map(v => v?.toString() ?? '')],
      },
    });
  } catch (error) {
    console.error('[Sheets] Error updating row:', error);
    throw new Error('Failed to update Google Sheets');
  }
}

async function findRowByColumn(
  sheetId: string,
  range: string,
  columnIndex: number,
  value: string
): Promise<{ rowNumber: number; data: string[] } | null> {
  const rows = await getSheetData(sheetId, range);

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][columnIndex] === value) {
      return {
        rowNumber: i + 1, // Sheet rows are 1-indexed
        data: rows[i],
      };
    }
  }

  return null;
}

// ============================================
// Services Operations
// ============================================

export async function getAllServices(): Promise<Service[]> {
  const sheetId = getSheetId('services');
  const rows = await getSheetData(sheetId, 'Sheet1!A:G');

  // Skip header row
  const dataRows = rows.slice(1);

  return dataRows
    .filter(row => row.length >= 7)
    .map(row => ({
      id: row[0],
      category: row[1],
      name: row[2],
      description: row[3],
      durationMinutes: parseInt(row[4], 10),
      priceCents: parseInt(row[5], 10),
      isActive: row[6]?.toLowerCase() === 'true',
    }))
    .filter(service => service.isActive);
}

export async function getServiceById(serviceId: string): Promise<Service | null> {
  const services = await getAllServices();
  return services.find(s => s.id === serviceId) || null;
}

export async function getServicesByCategory(): Promise<Record<string, Service[]>> {
  const services = await getAllServices();

  return services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
}

// ============================================
// Bookings Operations
// ============================================

const BOOKING_COLUMNS = [
  'id', 'service_id', 'customer_name', 'customer_email', 'customer_phone',
  'appointment_datetime', 'status', 'calendar_event_id', 'payment_id',
  'created_at', 'updated_at', 'notes'
];

function rowToBooking(row: string[]): Booking {
  return {
    id: row[0],
    serviceId: row[1],
    customerName: row[2],
    customerEmail: row[3],
    customerPhone: row[4],
    appointmentDatetime: row[5],
    status: row[6] as Booking['status'],
    calendarEventId: row[7] || null,
    paymentId: row[8] || null,
    createdAt: row[9],
    updatedAt: row[10],
    notes: row[11] || null,
  };
}

function bookingToRow(booking: Booking): string[] {
  return [
    booking.id,
    booking.serviceId,
    booking.customerName,
    booking.customerEmail,
    booking.customerPhone,
    booking.appointmentDatetime,
    booking.status,
    booking.calendarEventId || '',
    booking.paymentId || '',
    booking.createdAt,
    booking.updatedAt,
    booking.notes || '',
  ];
}

export interface CreateBookingParams {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDatetime: string;
  notes?: string;
}

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const sheetId = getSheetId('bookings');
  const now = new Date().toISOString();

  const booking: Booking = {
    id: uuidv4(),
    serviceId: params.serviceId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    appointmentDatetime: params.appointmentDatetime,
    status: 'pending',
    calendarEventId: null,
    paymentId: null,
    createdAt: now,
    updatedAt: now,
    notes: params.notes || null,
  };

  await appendSheetRow(sheetId, 'Sheet1!A:L', bookingToRow(booking));
  console.log(`[Sheets] Created booking: ${booking.id}`);

  return booking;
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const sheetId = getSheetId('bookings');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:L', 0, bookingId);

  if (!result) {
    return null;
  }

  return rowToBooking(result.data);
}

export async function updateBooking(
  bookingId: string,
  updates: Partial<Omit<Booking, 'id' | 'createdAt'>>
): Promise<Booking | null> {
  const sheetId = getSheetId('bookings');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:L', 0, bookingId);

  if (!result) {
    return null;
  }

  const existingBooking = rowToBooking(result.data);
  const updatedBooking: Booking = {
    ...existingBooking,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const range = `Sheet1!A${result.rowNumber}:L${result.rowNumber}`;
  await updateSheetRow(sheetId, range, bookingToRow(updatedBooking));

  console.log(`[Sheets] Updated booking: ${bookingId}`);
  return updatedBooking;
}

export async function getBookingsForDate(date: string): Promise<Booking[]> {
  const sheetId = getSheetId('bookings');
  const rows = await getSheetData(sheetId, 'Sheet1!A:L');

  // Skip header row
  const dataRows = rows.slice(1);

  return dataRows
    .filter(row => row.length >= 10)
    .map(rowToBooking)
    .filter(booking => {
      // Filter by date (comparing just the date part)
      const bookingDate = booking.appointmentDatetime.split('T')[0];
      return bookingDate === date && booking.status !== 'cancelled';
    });
}

export async function getBookingsByEmail(email: string): Promise<Booking[]> {
  const sheetId = getSheetId('bookings');
  const rows = await getSheetData(sheetId, 'Sheet1!A:L');

  // Skip header row
  const dataRows = rows.slice(1);

  return dataRows
    .filter(row => row.length >= 10 && row[3]?.toLowerCase() === email.toLowerCase())
    .map(rowToBooking);
}

// ============================================
// Payments Operations
// ============================================

const PAYMENT_COLUMNS = [
  'id', 'booking_id', 'square_payment_id', 'amount_cents',
  'status', 'payment_method', 'created_at', 'updated_at'
];

function rowToPayment(row: string[]): Payment {
  return {
    id: row[0],
    bookingId: row[1],
    squarePaymentId: row[2],
    amountCents: parseInt(row[3], 10),
    status: row[4] as Payment['status'],
    paymentMethod: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  };
}

function paymentToRow(payment: Payment): string[] {
  return [
    payment.id,
    payment.bookingId,
    payment.squarePaymentId,
    payment.amountCents.toString(),
    payment.status,
    payment.paymentMethod,
    payment.createdAt,
    payment.updatedAt,
  ];
}

export interface CreatePaymentParams {
  bookingId: string;
  squarePaymentId: string;
  amountCents: number;
  status: Payment['status'];
  paymentMethod: string;
}

export async function createPayment(params: CreatePaymentParams): Promise<Payment> {
  const sheetId = getSheetId('payments');
  const now = new Date().toISOString();

  const payment: Payment = {
    id: uuidv4(),
    bookingId: params.bookingId,
    squarePaymentId: params.squarePaymentId,
    amountCents: params.amountCents,
    status: params.status,
    paymentMethod: params.paymentMethod,
    createdAt: now,
    updatedAt: now,
  };

  await appendSheetRow(sheetId, 'Sheet1!A:H', paymentToRow(payment));
  console.log(`[Sheets] Created payment: ${payment.id}`);

  return payment;
}

export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const sheetId = getSheetId('payments');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:H', 0, paymentId);

  if (!result) {
    return null;
  }

  return rowToPayment(result.data);
}

export async function getPaymentBySquareId(squarePaymentId: string): Promise<Payment | null> {
  const sheetId = getSheetId('payments');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:H', 2, squarePaymentId);

  if (!result) {
    return null;
  }

  return rowToPayment(result.data);
}

export async function updatePayment(
  paymentId: string,
  updates: Partial<Omit<Payment, 'id' | 'createdAt'>>
): Promise<Payment | null> {
  const sheetId = getSheetId('payments');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:H', 0, paymentId);

  if (!result) {
    return null;
  }

  const existingPayment = rowToPayment(result.data);
  const updatedPayment: Payment = {
    ...existingPayment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const range = `Sheet1!A${result.rowNumber}:H${result.rowNumber}`;
  await updateSheetRow(sheetId, range, paymentToRow(updatedPayment));

  console.log(`[Sheets] Updated payment: ${paymentId}`);
  return updatedPayment;
}

export async function updatePaymentBySquareId(
  squarePaymentId: string,
  updates: Partial<Omit<Payment, 'id' | 'createdAt'>>
): Promise<Payment | null> {
  const sheetId = getSheetId('payments');
  const result = await findRowByColumn(sheetId, 'Sheet1!A:H', 2, squarePaymentId);

  if (!result) {
    return null;
  }

  const existingPayment = rowToPayment(result.data);
  const updatedPayment: Payment = {
    ...existingPayment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const range = `Sheet1!A${result.rowNumber}:H${result.rowNumber}`;
  await updateSheetRow(sheetId, range, paymentToRow(updatedPayment));

  console.log(`[Sheets] Updated payment by Square ID: ${squarePaymentId}`);
  return updatedPayment;
}
