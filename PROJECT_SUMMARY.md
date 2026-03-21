# Lystic Lavish Beauty Bar - Project Summary

A booking website for a luxury beauty bar/spa business.

---

## Core Features

### 5-Step Booking Flow

1. **Service Selection** - Browse services by category (Facials, Waxing, Eye Enhancement, Makeup)
2. **Customer Info** - Collect name, email, phone, notes
3. **Time Selection** - Pick available appointment slots
4. **Payment** - Process payment via Square
5. **Confirmation** - Show booking confirmation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (luxury design system) |
| Payments | Square Web Payments SDK |
| Calendar | Google Calendar API |
| Data Storage | Google Sheets API |
| Validation | Zod |

---

## Design System

Luxury-focused color palette:

- **Champagne/Nude** - Soft background tones
- **Espresso** - Rich text colors
- **Gold** - Accent/CTA highlights

---

## Services Offered (22 total)

### Facials (8 services)
- Mini Facial
- Basic & Back Facials (Women)
- Basic Back Facials (Men)
- Acne Facial (Grade 1 & 2)
- Full Lavish Hydrating Glow Facial
- Men's Custom Bearded "Dapper than Ever" Facial
- Microdermabrasion Facial
- Microneedling

### Waxing (8 services)
- Underarm Waxing
- Chin Waxing
- Brow Waxing
- Brow Lamination & Waxing
- Full Arm Wax
- Leg Waxing
- Brow Wax w/Tint
- Brow Lamination / Tint / Wax

### Eye Enhancement (3 services)
- Brow Lamination
- Brow Tint ONLY
- Brow Lamination & Tint

### Makeup (3 services)
- Natural Glam
- Soft Glam
- Full Glam

---

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (services, bookings, payments, availability)
│   ├── booking/          # Booking flow page
│   └── page.tsx          # Homepage
├── components/
│   ├── booking/          # Booking step components
│   ├── home/             # Homepage sections
│   └── ui/               # Reusable UI components (Button, Card, etc.)
├── data/
│   └── services.json     # Service definitions with images
└── lib/
    ├── availability/     # Time slot generation logic
    ├── google/           # Google API authentication
    ├── validation/       # Zod schemas
    └── utils.ts          # Utility functions
```

---

## Environment Configuration

Key environment variables (see `.env.example`):

- `BUSINESS_HOURS_JSON` - Operating hours per day
- `BUSINESS_TIMEZONE` - IANA timezone (e.g., "America/New_York")
- `GOOGLE_*` - Google API credentials
- `SQUARE_*` - Square payment credentials
- `NEXT_PUBLIC_*` - Client-exposed variables

---

## Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## Service Images

Images are stored in `public/services/` and mapped to services:

| Image File | Services Using It |
|------------|-------------------|
| mini_facial.png | Mini Facial |
| back_facial.png | Basic & Back Facials (Women/Men) |
| acne_facial.png | Acne Facial |
| lavish_glow_facial.png | Lavish Glow, Microdermabrasion |
| mens_beard_facial.png | Dapper Facial |
| microneedling.png | Microneedling |
| waxing.png | All basic waxing services |
| lash_and_brow_tint.png | Brow lamination/tint combos |
| makeup_application.png | All makeup services |

### Images Needed

The following services need dedicated images:
- Microdermabrasion Facial
- Underarm/Chin/Brow/Leg/Arm Waxing (individual images)
- Brow Lamination (standalone)
- Brow Tint (standalone)
- Natural/Soft/Full Glam (individual images)
