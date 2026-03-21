import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local with proper multiline key handling
const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const env = {};

// Extract GOOGLE_PRIVATE_KEY separately since it spans multiple lines
const keyMatch = envContent.match(/GOOGLE_PRIVATE_KEY="(-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----\n?)"/);
const privateKey = keyMatch ? keyMatch[1] : null;
if (!privateKey) throw new Error('Could not parse GOOGLE_PRIVATE_KEY from .env.local');

for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match && match[1] !== 'GOOGLE_PRIVATE_KEY') {
    env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
  }
}

const CALENDAR_ID = env.GOOGLE_CALENDAR_ID;
const OWNER_EMAIL = env.BUSINESS_EMAIL;

console.log('Calendar ID:', CALENDAR_ID);
console.log('Owner email:', OWNER_EMAIL);
console.log('Service account:', env.GOOGLE_SERVICE_ACCOUNT_EMAIL);

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

console.log(`\nSharing calendar with ${OWNER_EMAIL}...`);

try {
  const result = await calendar.acl.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      role: 'writer',
      scope: { type: 'user', value: OWNER_EMAIL },
    },
  });
  console.log(`✓ Done! Role: ${result.data.role}, Scope: ${result.data.scope?.value}`);
} catch (err) {
  if (err.code === 409) {
    console.log('Already shared. Checking current permissions...');
    const rules = await calendar.acl.list({ calendarId: CALENDAR_ID });
    console.log('Current ACL rules:');
    rules.data.items?.forEach(r => console.log(` - ${r.scope?.value}: ${r.role}`));
  } else {
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
  }
}
