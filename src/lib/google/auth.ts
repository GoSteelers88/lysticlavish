import { google } from 'googleapis';

/**
 * Creates an authenticated Google API client using service account credentials.
 * Handles private key formatting for different environments.
 */
export function getGoogleAuth(scopes: string[]) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'Missing Google service account credentials. ' +
      'Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are set.'
    );
  }

  // Handle private key formatting - replace escaped newlines
  // This is necessary because env vars often have literal \n instead of actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes,
  });

  return auth;
}

/**
 * Standard scopes for Google Calendar API
 */
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Standard scopes for Google Sheets API
 */
export const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];
