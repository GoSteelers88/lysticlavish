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

function formatDateShort(iso: string) {
  const zoned = toZonedTime(new Date(iso), TIMEZONE);
  return format(zoned, 'MMM d');
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendCustomerConfirmation(params: {
  customerName: string;
  customerEmail: string;
  serviceNames: string[];
  appointmentDatetime: string;
  durationMinutes: number;
  totalPriceCents: number;
  depositPaidCents: number;
  bookingId: string;
}) {
  const {
    customerName,
    customerEmail,
    serviceNames,
    appointmentDatetime,
    durationMinutes,
    totalPriceCents,
    depositPaidCents,
    bookingId,
  } = params;

  const balanceDueCents = totalPriceCents - depositPaidCents;
  const serviceLabel = serviceNames.length === 1 ? serviceNames[0] : serviceNames.join(', ');
  const serviceListHtml = serviceNames.length === 1
    ? `<td style="padding: 6px 0; color: #1a0a00; font-weight: bold;">${serviceNames[0]}</td>`
    : `<td style="padding: 6px 0; color: #1a0a00; font-weight: bold;">${serviceNames.map(n => `• ${n}`).join('<br>')}</td>`;

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
                <td style="padding: 6px 0; color: #9b8676; font-size: 13px; width: 140px; vertical-align: top;">${serviceNames.length > 1 ? 'Services' : 'Service'}</td>
                ${serviceListHtml}
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
    subject: `Booking Confirmed — ${serviceLabel} on ${formatDateShort(appointmentDatetime)}`,
    html,
  });
}

export async function sendBusinessNotification(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceNames: string[];
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
    serviceNames,
    appointmentDatetime,
    durationMinutes,
    depositPaidCents,
    notes,
    bookingId,
  } = params;

  const serviceLabel = serviceNames.length === 1 ? serviceNames[0] : serviceNames.join(' + ');
  const serviceDisplay = serviceNames.length === 1
    ? serviceNames[0]
    : serviceNames.map(n => `<span style="display:block">• ${n}</span>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f0ece6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a0a00 0%, #3d1a00 100%); border-radius: 12px 12px 0 0; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="color: #c9a96e; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 4px;">New Booking</p>
            <h1 style="color: #fff; font-size: 20px; margin: 0; font-family: Georgia, serif;">${serviceLabel}</h1>
            <p style="color: #d4c5b0; font-size: 14px; margin: 6px 0 0;">${formatDateTime(appointmentDatetime)}</p>
          </div>
          <div style="background: #c9a96e; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="color: #1a0a00; font-size: 22px;">✨</span>
          </div>
        </div>

        <!-- Body -->
        <div style="background: #fff; padding: 32px; border-left: 1px solid #e8e0d8; border-right: 1px solid #e8e0d8;">

          <!-- Client Info -->
          <div style="margin-bottom: 24px;">
            <p style="color: #9b8676; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Client Information</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 6px 6px 0 0; color: #6b5c4e; font-size: 13px; width: 100px; border-bottom: 1px solid #f0ece6;">Name</td>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 6px 6px 0 0; font-weight: 600; color: #1a0a00; border-bottom: 1px solid #f0ece6;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; color: #6b5c4e; font-size: 13px; border-bottom: 1px solid #f0ece6;">Email</td>
                <td style="padding: 8px 12px; background: #faf8f5; border-bottom: 1px solid #f0ece6;"><a href="mailto:${customerEmail}" style="color: #c9a96e; text-decoration: none; font-weight: 500;">${customerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 0 0 6px 6px; color: #6b5c4e; font-size: 13px;">Phone</td>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 0 0 6px 6px;"><a href="tel:${customerPhone}" style="color: #c9a96e; text-decoration: none; font-weight: 500;">${customerPhone}</a></td>
              </tr>
            </table>
          </div>

          <!-- Appointment Info -->
          <div style="margin-bottom: 24px;">
            <p style="color: #9b8676; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Appointment Details</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 6px 6px 0 0; color: #6b5c4e; font-size: 13px; width: 100px; border-bottom: 1px solid #f0ece6; vertical-align: top;">${serviceNames.length > 1 ? 'Services' : 'Service'}</td>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 6px 6px 0 0; font-weight: 500; color: #1a0a00; border-bottom: 1px solid #f0ece6;">${serviceDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; color: #6b5c4e; font-size: 13px; border-bottom: 1px solid #f0ece6;">Duration</td>
                <td style="padding: 8px 12px; background: #faf8f5; color: #1a0a00; border-bottom: 1px solid #f0ece6;">${durationMinutes} min</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 0 0 6px 6px; color: #6b5c4e; font-size: 13px;">Date & Time</td>
                <td style="padding: 8px 12px; background: #faf8f5; border-radius: 0 0 6px 6px; color: #1a0a00;">${formatDateTime(appointmentDatetime)}</td>
              </tr>
            </table>
          </div>

          <!-- Deposit Badge -->
          <div style="background: linear-gradient(135deg, #f0faf2 0%, #e8f5eb 100%); border: 1px solid #a8d5b0; border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: ${notes ? '24px' : '0'};">
            <div>
              <p style="color: #2d6b3a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 2px;">Deposit Collected</p>
              <p style="color: #1a4523; font-size: 22px; font-weight: 700; margin: 0; font-family: Georgia, serif;">${formatPrice(depositPaidCents)}</p>
            </div>
            <span style="font-size: 28px;">💳</span>
          </div>

          ${notes ? `
          <!-- Notes -->
          <div style="background: #fffbf0; border: 1px solid #e8d9a0; border-radius: 8px; padding: 16px 20px;">
            <p style="color: #9b8676; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Client Notes</p>
            <p style="color: #1a0a00; font-size: 14px; margin: 0; line-height: 1.6;">${notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #1a0a00; border-radius: 0 0 12px 12px; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;">
          <p style="color: #9b8676; font-size: 11px; margin: 0;">Booking ID: <span style="color: #c9a96e; font-family: monospace;">${bookingId.slice(0, 8).toUpperCase()}</span></p>
          <p style="color: #9b8676; font-size: 11px; margin: 0;">Lystic Lavish Beauty Bar</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: FROM,
    to: BUSINESS_EMAIL,
    subject: `New Booking: ${customerName} — ${serviceLabel} on ${formatDateShort(appointmentDatetime)}`,
    html,
  });
}
