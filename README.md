# Lystic Lavish Beauty Bar

A luxury beauty bar website with online booking, Google Calendar integration, and Square payments.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Calendar**: Google Calendar API
- **Database**: Google Sheets API
- **Payments**: Square Web Payments SDK

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud account
- Square Developer account

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd lystic-lavish-beauty-bar
npm install
```

### 2. Google Cloud Setup

#### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Sheets API
4. Go to **IAM & Admin > Service Accounts**
5. Click **Create Service Account**
6. Name it (e.g., "lystic-lavish-booking")
7. Click **Create and Continue** (skip optional steps)
8. Click on the created service account
9. Go to **Keys** tab
10. Click **Add Key > Create new key**
11. Choose **JSON** and download

From the JSON file, you'll need:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

#### Setup Google Calendar

1. Go to [Google Calendar](https://calendar.google.com/)
2. Create a new calendar for appointments (or use existing)
3. Click the three dots next to your calendar > **Settings and sharing**
4. Under **Share with specific people**, click **Add people**
5. Enter your service account email (from JSON file)
6. Set permission to **Make changes to events**
7. Scroll down to find **Calendar ID** under **Integrate calendar**
8. Copy this to `GOOGLE_CALENDAR_ID`

#### Setup Google Sheets

Create 3 Google Sheets for your database:

**Services Sheet:**
Create headers in row 1:
```
id | category | name | description | duration_minutes | price_cents | is_active
```

**Bookings Sheet:**
Create headers in row 1:
```
id | service_id | customer_name | customer_email | customer_phone | appointment_datetime | status | calendar_event_id | payment_id | created_at | updated_at | notes
```

**Payments Sheet:**
Create headers in row 1:
```
id | booking_id | square_payment_id | amount_cents | status | payment_method | created_at | updated_at
```

For each sheet:
1. Click **Share** button
2. Add your service account email with **Editor** access
3. Copy the Sheet ID from URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 3. Square Setup

#### Create Square Application

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Click **Create Application**
3. Name it (e.g., "Lystic Lavish Booking")
4. Select your country

#### Get Credentials

From your Square application:

1. **Application ID** (`SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_APP_ID`)
   - Found on the main app page

2. **Access Token** (`SQUARE_ACCESS_TOKEN`)
   - Go to **Credentials** tab
   - Use Sandbox token for testing, Production for live

3. **Location ID** (`SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`)
   - Go to **Locations** tab
   - Use your default location ID

#### Setup Webhook (Optional but recommended)

1. Go to **Webhooks** tab
2. Click **Add Webhook**
3. Enter your webhook URL: `https://your-domain.com/api/payments/square/webhook`
4. Select events: `payment.completed`, `payment.failed`
5. Copy the **Signature Key** to `SQUARE_WEBHOOK_SIGNATURE_KEY`

### 4. Environment Variables

1. Copy the example env file:
```bash
cp .env.example .env.local
```

2. Fill in all values in `.env.local` with your credentials

### 5. Seed Services Data

After setting up your Services Google Sheet, you can seed it with initial data by running:

```bash
npm run seed
```

Or manually add services to your Google Sheet.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Update these for production:
- `SQUARE_ENV=production`
- `BASE_URL=https://your-domain.com`
- `NEXT_PUBLIC_BASE_URL=https://your-domain.com`
- Use production Square credentials

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── services/route.ts      # Get services list
│   │   ├── availability/route.ts  # Get available time slots
│   │   ├── bookings/route.ts      # Create/manage bookings
│   │   └── payments/
│   │       ├── square/route.ts    # Process payments
│   │       └── square/webhook/route.ts
│   ├── booking/page.tsx           # Booking flow page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Homepage
├── components/
│   ├── booking/                   # Booking flow components
│   ├── home/                      # Homepage sections
│   └── ui/                        # Reusable UI components
└── lib/
    ├── google/
    │   ├── calendar.ts            # Calendar API helpers
    │   └── sheets.ts              # Sheets API helpers
    ├── square/
    │   └── client.ts              # Square SDK setup
    ├── availability/
    │   └── slots.ts               # Slot generation logic
    └── validation/
        └── schemas.ts             # Zod schemas
```

## API Endpoints

### GET /api/services
Returns list of active services grouped by category.

### GET /api/availability
Query params: `serviceId`, `date` (YYYY-MM-DD)
Returns available time slots for the given service and date.

### POST /api/bookings
Creates a new pending booking.
Body: `{ serviceId, customerName, customerEmail, customerPhone, appointmentDatetime, notes? }`

### POST /api/payments/square
Processes payment and confirms booking.
Body: `{ bookingId, sourceId (from Square), amount }`

### POST /api/payments/square/webhook
Square webhook endpoint for payment events.

## License

Private - All rights reserved.
