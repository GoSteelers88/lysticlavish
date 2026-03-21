import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"([\s\S]*)"$/, '$1');
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;

const testDatetime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

console.log('Sending test emails...');
console.log('Business email:', BUSINESS_EMAIL);

const [customerResult, businessResult] = await Promise.all([
  resend.emails.send({
    from: 'Lystic Lavish Beauty Bar <bookings@lystic-lavish.com>',
    to: BUSINESS_EMAIL,
    subject: '[TEST] Customer Confirmation Email',
    html: `
      <div style="font-family: Arial; padding: 20px; background: #faf8f5;">
        <h2 style="color: #1a0a00;">✅ Customer email is working!</h2>
        <p>This is a test of the customer confirmation email.</p>
        <hr>
        <p><b>Service:</b> Full Lavish Hydrating Glow Facial</p>
        <p><b>Date:</b> ${new Date(testDatetime).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })}</p>
        <p><b>Location:</b> 213 Damsenberry Way, China Grove, NC 28023</p>
        <p><b>Deposit Paid:</b> $75.00</p>
        <p><b>Balance Due at Appointment:</b> $75.00</p>
      </div>
    `,
  }),
  resend.emails.send({
    from: 'Lystic Lavish Beauty Bar <bookings@lystic-lavish.com>',
    to: BUSINESS_EMAIL,
    subject: '[TEST] Business Notification Email',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: #c9a96e;">✅ Business notification is working!</h2>
        <p>This is a test of the owner notification email.</p>
        <hr>
        <p><b>Client:</b> Jane Doe</p>
        <p><b>Email:</b> janedoe@test.com</p>
        <p><b>Phone:</b> (555) 123-4567</p>
        <p><b>Service:</b> Full Lavish Hydrating Glow Facial</p>
        <p><b>Deposit Paid:</b> $75.00</p>
      </div>
    `,
  }),
]);

console.log('Customer email:', customerResult.error ? `FAILED — ${customerResult.error.message}` : `OK — ${customerResult.data?.id}`);
console.log('Business email:', businessResult.error ? `FAILED — ${businessResult.error.message}` : `OK — ${businessResult.data?.id}`);
