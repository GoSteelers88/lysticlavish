import { Resend } from 'resend';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Lystic Lavish Beauty Bar <bookings@lystic-lavish.com>';
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL!;
const TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/New_York';

function formatDateTime(iso: string) {
  const zoned = toZonedTime(new Date(iso), TIMEZONE);
  return format(zoned, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendCustomerConfirmation(params: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDatetime: string;
  durationMinutes: number;
  totalPriceCents: number;
  depositPaidCents: number;
  bookingId: string;
}) {
  const {
    customerName,
    customerEmail,
    serviceName,
    appointmentDatetime,
    durationMinutes,
    totalPriceCents,
    depositPaidCents,
    bookingId,
  } = params;

  const balanceDueCents = totalPriceCents - depositPaidCents;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Georgia, serif; background: #faf8f5; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <div style="background: #1a0a00; padding: 32px 40px; text-align: center;">
          <h1 style="color: #c9a96e; font-size: 24px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Lystic Lavish</h1>
          <p style="color: #d4c5b0; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">BEAUTY BAR</p>
        </div>

        <div style="padding: 40px;">
          <h2 style="color: #1a0a00; font-size: 20px; margin: 0 0 8px;">Booking Confirmed!</h2>
          <p style="color: #6b5c4e; margin: 0 0 32px;">Hi ${customerName}, your appointment is all set. We can't wait to see you!</p>

          <div style="background: #faf8f5; border-left: 3px solid #c9a96e; border-radius: 4px; padding: 24px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #9b8676; font-size: 13px; width: 140px;">Service</td>
                <td style="padding: 6px 0; color: #1a0a00; font-weight: bold;">${serviceName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9b8676; font-size: 13px;">Date & Time</td>
                <td style="padding: 6px 0; color: #1a0a00;">${formatDateTime(appointmentDatetime)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9b8676; font-size: 13px;">Duration</td>
                <td style="padding: 6px 0; color: #1a0a00;">${durationMinutes} minutes</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #9b8676; font-size: 13px;">Location</td>
                <td style="padding: 6px 0; color: #1a0a00;">213 Damsenberry Way<br>China Grove, NC 28023</td>
              </tr>
            </table>
          </div>

          <div style="background: #faf8f5; border-radius: 4px; padding: 24px; margin-bottom: 32px;">
            <h3 style="color: #1a0a00; font-size: 14px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Payment Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #6b5c4e;">Service Total</td>
                <td style="padding: 4px 0; color: #1a0a00; text-align: right;">${formatPrice(totalPriceCents)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b5c4e;">Deposit Paid</td>
                <td style="padding: 4px 0; color: #2d7a3a; text-align: right;">− ${formatPrice(depositPaidCents)}</td>
              </tr>
              <tr style="border-top: 1px solid #e8e0d8;">
                <td style="padding: 12px 0 4px; color: #1a0a00; font-weight: bold;">Balance Due at Appointment</td>
                <td style="padding: 12px 0 4px; color: #c9a96e; font-weight: bold; text-align: right;">${formatPrice(balanceDueCents)}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b5c4e; font-size: 14px; line-height: 1.6;">
            Please arrive 5–10 minutes early. If you need to cancel or reschedule, contact us at least 24 hours in advance.
          </p>

          <p style="color: #9b8676; font-size: 12px; margin-top: 32px;">Booking ID: ${bookingId}</p>
        </div>

        <div style="background: #1a0a00; padding: 24px 40px; text-align: center;">
          <p style="color: #9b8676; font-size: 12px; margin: 0;">
            Questions? Reply to this email or call us.<br>
            213 Damsenberry Way, China Grove, NC 28023
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Booking Confirmed — ${serviceName} on ${format(toZonedTime(new Date(appointmentDatetime), TIMEZONE), 'MMM d')}`,
    html,
  });
}

export async function sendBusinessNotification(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  appointmentDatetime: string;
  durationMinutes: number;
  depositPaidCents: number;
  notes?: string;
  bookingId: string;
}) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceName,
    appointmentDatetime,
    durationMinutes,
    depositPaidCents,
    notes,
    bookingId,
  } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <div style="background: #c9a96e; padding: 24px 32px;">
          <h1 style="color: #fff; font-size: 18px; margin: 0;">New Booking — ${serviceName}</h1>
          <p style="color: #fff; margin: 4px 0 0; font-size: 14px; opacity: 0.9;">${formatDateTime(appointmentDatetime)}</p>
        </div>

        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px; font-size: 14px;">Client</td><td style="padding: 8px 0; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${customerEmail}" style="color: #c9a96e;">${customerEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Phone</td><td style="padding: 8px 0;"><a href="tel:${customerPhone}" style="color: #c9a96e;">${customerPhone}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Service</td><td style="padding: 8px 0;">${serviceName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 8px 0;">${durationMinutes} min</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Deposit Paid</td><td style="padding: 8px 0; color: #2d7a3a; font-weight: bold;">${formatPrice(depositPaidCents)}</td></tr>
            ${notes ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Notes</td><td style="padding: 8px 0;">${notes}</td></tr>` : ''}
          </table>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Booking ID: ${bookingId}</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: FROM,
    to: BUSINESS_EMAIL,
    subject: `New Booking: ${customerName} — ${serviceName} on ${format(toZonedTime(new Date(appointmentDatetime), TIMEZONE), 'MMM d')}`,
    html,
  });
}
