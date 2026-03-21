import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { addMinutes } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const env = {};
const keyMatch = envContent.match(/GOOGLE_PRIVATE_KEY="(-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----\n?)"/);
const privateKey = keyMatch ? keyMatch[1] : null;
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match && match[1] !== 'GOOGLE_PRIVATE_KEY') env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
}

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

const start = addMinutes(new Date(), 60);
const end = addMinutes(start, 60);

console.log('Creating test calendar event (no attendees, shared calendar)...');

const result = await calendar.events.insert({
  calendarId: env.GOOGLE_CALENDAR_ID,
  sendUpdates: 'none',
  requestBody: {
    summary: '[TEST] Brow Wax - Jane Doe',
    description: 'Test booking event\nService: Brow Wax\nClient: Jane Doe\nPhone: (555) 123-4567',
    location: '213 Damsenberry Way, China Grove, NC 28023',
    start: { dateTime: start.toISOString(), timeZone: env.BUSINESS_TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: env.BUSINESS_TIMEZONE },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
      ],
    },
  },
});

console.log(`✓ Event created: ${result.data.id}`);
console.log(`  View: ${result.data.htmlLink}`);
console.log(`\nCheck ${env.BUSINESS_EMAIL}'s Google Calendar — it should appear since the calendar is shared with her.`);
