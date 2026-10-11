# Lystic Lavish Beauty Bar

## What This Is
Online booking system for Lystic Lavish Beauty Bar — a luxury beauty salon. 5-step booking flow with multi-service selection, 50% deposit payments via Square, Google Calendar integration, and automated email confirmations.

## Stack
- **Next.js 14+** with App Router (`src/app/`)
- **TypeScript** strict mode
- **Tailwind CSS** with custom luxury design system
- **Zod** for runtime validation (comprehensive schemas)
- **Google APIs** — Calendar (appointments) + Sheets (bookings/payments data)
- **Square SDK** — Web Payments SDK (frontend) + Payments API (backend)
- **Resend** — transactional email (customer + business notifications)
- **date-fns + date-fns-tz** — timezone-aware datetime handling

## How to Run
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (no emit)
```

## Core Booking Flow (5 Steps)
1. **Service Selection** → pick one or more services
2. **Customer Info** → name, email, phone, optional notes
3. **Time Selection** → date picker + available time slots
4. **Payment** → 50% deposit via Square Web Payments SDK
5. **Confirmation** → success screen with booking ID

State managed in `src/app/booking/page.tsx`, passed to step components.

## Payment Model
- **Deposit**: 50% of total collected upfront via Square
- **Balance**: 50% due at appointment (not collected online)
- Customer + business receive email confirmations with payment summary
- Refunds via Square webhook auto-cancel booking + calendar event

### Affirm (pay in full over time) — `src/lib/affirm/client.ts`, `src/app/api/payments/affirm/route.ts`
- Affirm customers pay the **full price**; shown only when total ≥ `AFFIRM_MIN_CENTS` ($50). Square doesn't support Affirm, so it's a separate Direct API integration.
- Flow: affirm.js modal → `onSuccess` gives **`checkout_token`** (Affirm's docs say `checkout_id`; the script sends `checkout_token`) → server authorizes, checks amount == booking total, records an `AFFIRM pending` payment row, captures, marks it `completed`, confirms the booking.
- Every Affirm call carries an Idempotency-Key derived from the token/transaction id, so a retry can never create a second loan. **Unknown outcomes (no response / 5xx / 409 / 429) are never treated as declines**: retry, read the transaction, return 503 so the page keeps the token ("Finish booking"). Only a definitive 4xx voids a loan.
- **One payment per booking**: both payment routes write their payment row *before* charging, then call `findOtherActivePayment` and back off if another live row exists. Don't charge before claiming.
- Payments sheet: Affirm rows use `payment_method` `AFFIRM` and store the Affirm transaction id in `square_payment_id`.
- Affirm webhooks are only for Key/Enterprise merchants → **refunds are manual** in the Affirm dashboard; the owner also cancels the booking/calendar event herself.
- Env: `NEXT_PUBLIC_AFFIRM_ENV` (must be exactly `sandbox` or `production`, else Affirm is hidden), `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`, `AFFIRM_PRIVATE_KEY`. Sandbox and production keys are different pairs. Sandbox modal PIN: `123456`.

## Multi-Service Booking
- Service IDs encoded as `[sids:id1,id2,id3]` prefix in booking notes. Only the server writes it, it always starts with the booking's `serviceId`, and customer notes are stripped of the marker — `resolveBookingServices` ignores any prefix that doesn't match. **Always price from the booking row, never from the request body.**
- Total duration = sum of all selected services
- Total price = sum of all services
- All services shown in emails + calendar event

## Environment Variables
All documented in `.env.example`. Key categories:

**Business Config**: `BUSINESS_TIMEZONE`, `BUSINESS_HOURS_JSON`, `APPOINTMENT_BUFFER_MINUTES` (default 15), `BOOKING_WINDOW_DAYS` (default 60), `SLOT_INTERVAL_MINUTES` (default 30)

**Google**: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SHEETS_ID_SERVICES`, `GOOGLE_SHEETS_ID_BOOKINGS`, `GOOGLE_SHEETS_ID_PAYMENTS`

**Square**: `SQUARE_ENV`, `SQUARE_APP_ID`, `SQUARE_LOCATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_ENV`

**Affirm**: `NEXT_PUBLIC_AFFIRM_ENV`, `NEXT_PUBLIC_AFFIRM_PUBLIC_KEY`, `AFFIRM_PRIVATE_KEY`

**Email**: `RESEND_API_KEY`, `BUSINESS_EMAIL`

**App**: `BASE_URL`, `NEXT_PUBLIC_BASE_URL`

## API Layer (`src/app/api/`)

Standard response: `{ success, data?, error?, code?, details? }`

**Services** (`/api/services`)
- Source: local JSON only (`src/data/services.json`) — NOT Google Sheets
- Query: `id` (single), `grouped=true` (by category)

**Availability** (`/api/availability`)
- GET: time slots for service + date (filters Calendar + Sheets conflicts)
- POST: available dates within booking window

**Bookings** (`/api/bookings`)
- POST: create pending booking (validates slot first)
- GET: retrieve by ID
- PATCH: update status/datetime/notes/calendar/payment IDs

**Payments** (`/api/payments/square`)
- GET: Square client config (appId, locationId, env)
- POST: process 50% deposit → create calendar event → send emails → confirm booking

**Webhook** (`/api/payments/square/webhook`)
- HMAC-SHA256 signature verification
- Handles: payment.created/updated, refund.created/updated
- Refund → cancels booking + calendar event

## Email (Resend)
- Sender: `Lystic Lavish Beauty Bar <bookings@lystic-lavish.com>`
- **Customer confirmation**: service names, datetime, duration, location, payment summary, balance due
- **Business notification**: client info, service details, deposit collected, notes
- Failed email sends don't block payment success

## Google Integrations (`src/lib/google/`)
- **Auth**: Service account JWT (private key: escaped `\\n` → `\n`)
- **Calendar**: Creates events with customer details, 24hr + 1hr reminders, location: "213 Damsenberry Way, China Grove, NC 28023"
- **Sheets**: Services/Bookings/Payments sheets with CRUD + filtering, UUID generation

## Availability Logic (`src/lib/availability/slots.ts`)
- Generates slots at SLOT_INTERVAL_MINUTES intervals within business hours
- Applies APPOINTMENT_BUFFER_MINUTES before/after each appointment
- Checks conflicts against both Calendar events and Sheets bookings
- Ignores cancelled bookings, prevents past slots

## Validation (`src/lib/validation/schemas.ts`)
- Zod schemas for all inputs: phone, email, date, datetime, UUID, services, bookings, payments, webhooks
- `validateData(schema, data)` helper
- Custom `ValidationError` class with field-level errors

## Design System (Tailwind)
- `champagne-*` / `nude-*`: backgrounds
- `espresso-*`: text (deep brown)
- `gold-*`: accent/CTA
- Components in `src/components/ui/`: Button (4 variants), Card (3 variants), Input, Modal, Accordion

## Booking Lifecycle
1. `POST /api/bookings` → status: pending
2. `POST /api/payments/square` → payment + calendar + emails → status: confirmed
3. Square webhook → payment updates, refund cancellations
4. `PATCH /api/bookings` → manual updates (completed, no_show, cancelled)

Statuses: `pending | confirmed | cancelled | completed | no_show`

## File Structure
```
src/
├── app/
│   ├── api/availability/, bookings/, payments/, services/
│   ├── booking/              # Multi-step booking flow (client)
│   ├── page.tsx, layout.tsx
├── components/
│   ├── booking/              # Step components
│   ├── home/                 # Home page sections
│   ├── layout/               # Header/footer
│   └── ui/                   # Button, Card, Input, Modal, Accordion
├── lib/
│   ├── availability/slots.ts
│   ├── google/auth.ts, calendar.ts, sheets.ts
│   ├── square/client.ts
│   ├── email/index.ts
│   ├── validation/schemas.ts
│   └── utils.ts              # cn(), formatPrice(), formatDuration(), formatPhone(), slugify(), debounce()
├── data/services.json
```

## Key Patterns
- All datetime: `date-fns-tz` functions, never rely on system timezone
- `cn()` utility: `clsx` + `tailwind-merge` for Tailwind class merging
- Multi-service: encoded in notes prefix to avoid schema changes
- Services bound by: primary in `serviceId`, extras in notes prefix

## Current Work / Active Context
<!-- Update this section when starting/ending work sessions -->
