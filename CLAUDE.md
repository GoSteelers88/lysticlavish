# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emit
```

## Tech Stack

- **Next.js 14+** with App Router (all routes in `src/app/`)
- **TypeScript** with strict mode
- **Tailwind CSS** with custom luxury design system
- **Zod** for runtime validation
- **Google APIs** (Calendar + Sheets) for backend
- **Square SDK** for payments

## Architecture Overview

### Booking Flow
The core user journey is a 5-step booking process:
1. **Service Selection** → User picks from categorized services
2. **Customer Info** → Name, email, phone, notes
3. **Time Selection** → Date picker + available time slots
4. **Payment** → Square Web Payments SDK card form
5. **Confirmation** → Success screen with booking details

State is managed in `src/app/booking/page.tsx` and passed down to step components.

### API Layer (`src/app/api/`)
All API routes return `{ success: boolean, data?: T, error?: string }` format.

- **Services** currently uses local JSON fallback (`src/data/services.json`) when Google Sheets isn't configured
- **Availability** generates time slots based on business hours config, then filters out conflicts from Google Calendar events and existing bookings
- **Bookings** creates pending records, validates slot availability before confirming
- **Payments** flow: tokenize card (client) → process payment (Square API) → create calendar event → update booking status

### Backend Integrations (`src/lib/`)

**Google Auth** (`google/auth.ts`): Service account JWT authentication shared by Calendar and Sheets.

**Availability Logic** (`availability/slots.ts`):
- Reads `BUSINESS_HOURS_JSON` env var for open/close times per day
- Generates slots at `SLOT_INTERVAL_MINUTES` intervals
- Applies `APPOINTMENT_BUFFER_MINUTES` between appointments
- Filters conflicts against both Calendar events and Sheets bookings

**Square Webhook** (`api/payments/square/webhook/route.ts`): Verifies HMAC signature, handles `payment.completed`, `payment.failed`, and refund events.

### Design System

Custom Tailwind config with luxury palette:
- `champagne-*` / `nude-*`: Background tones
- `espresso-*`: Text colors
- `gold-*`: Accent/CTA colors

Key component patterns in `src/components/ui/`:
- `Button`: variants (primary/secondary/outline/ghost), sizes, loading state
- `Card`: variants (default/hover/luxury), padding options
- `Accordion`: Controlled expand/collapse for policies section

## Environment Variables

All env vars are documented in `.env.example`. Key ones:
- `BUSINESS_HOURS_JSON`: JSON object mapping day names to `{open, close}` times
- `BUSINESS_TIMEZONE`: IANA timezone (e.g., "America/New_York")
- Google and Square credentials prefixed appropriately (`GOOGLE_*`, `SQUARE_*`)
- Client-exposed vars use `NEXT_PUBLIC_*` prefix

## Key Patterns

- Services data has dual source: Google Sheets (production) or local JSON (demo/dev)
- All datetime handling uses `date-fns` and `date-fns-tz` for timezone awareness
- Validation schemas in `src/lib/validation/schemas.ts` are used by API routes
- The `cn()` utility (`src/lib/utils.ts`) merges Tailwind classes with `clsx` + `tailwind-merge`
