import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const key = JSON.parse(readFileSync(resolve(ROOT, 'google-sa-key.json'), 'utf8'));

const OWNER_EMAIL = 'llbrandowner@lystic-lavish.com';
const CALENDAR_ID = 'b6e2b4c4ea9022eb5208012773fb335ba2d1de1e409225f3b968e477e909fa34@group.calendar.google.com';

// Use JWT with DWD to impersonate the owner
const auth = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
  ],
  subject: OWNER_EMAIL,
});

const sheets = google.sheets({ version: 'v4', auth });
const drive  = google.drive({ version: 'v3', auth });

async function createSheet(title, headers) {
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{
        properties: { title: 'Sheet1' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{ values: headers.map(v => ({ userEnteredValue: { stringValue: v } })) }],
        }],
      }],
    },
  });
  return res.data.spreadsheetId;
}

async function main() {
  console.log('Creating Google Sheets as', OWNER_EMAIL, '...\n');

  const bookingsId = await createSheet('Lystic Lavish - Bookings', [
    'id','service_id','customer_name','customer_email','customer_phone',
    'appointment_datetime','status','calendar_event_id','payment_id',
    'created_at','updated_at','notes',
  ]);
  console.log(`✓ Bookings sheet:  ${bookingsId}`);

  const paymentsId = await createSheet('Lystic Lavish - Payments', [
    'id','booking_id','square_payment_id','amount_cents',
    'status','payment_method','created_at','updated_at',
  ]);
  console.log(`✓ Payments sheet:  ${paymentsId}`);

  const servicesId = await createSheet('Lystic Lavish - Services', [
    'id','category','name','description','duration_minutes','price_cents','is_active',
  ]);
  console.log(`✓ Services sheet:  ${servicesId}`);

  // Update .env.local
  let env = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  env = env.replace(/GOOGLE_CALENDAR_ID=.*/,        `GOOGLE_CALENDAR_ID=${CALENDAR_ID}`);
  env = env.replace(/GOOGLE_SHEETS_ID_BOOKINGS=.*/, `GOOGLE_SHEETS_ID_BOOKINGS=${bookingsId}`);
  env = env.replace(/GOOGLE_SHEETS_ID_PAYMENTS=.*/, `GOOGLE_SHEETS_ID_PAYMENTS=${paymentsId}`);
  env = env.replace(/GOOGLE_SHEETS_ID_SERVICES=.*/, `GOOGLE_SHEETS_ID_SERVICES=${servicesId}`);
  writeFileSync(resolve(ROOT, '.env.local'), env);

  console.log('\n✓ .env.local updated with all IDs');
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
