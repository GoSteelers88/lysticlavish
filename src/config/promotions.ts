import { formatInTimeZone } from 'date-fns-tz';

/**
 * Site-wide promotion — the ONE place a sale is defined.
 *
 * Everything prices through `promoPriceCents`: the services API (booking
 * flow), `resolveBookingServices` (what the card deposit and Affirm routes
 * charge), the home page service cards, and the hero ribbon. Change the
 * numbers here and every one of them moves together.
 *
 * The sale runs on its own between `startDate` and `endDate` (inclusive,
 * business time zone). `active: false` kills it early.
 */
export const PROMOTION = {
  active: true,
  /** First and last day of the sale, inclusive, as yyyy-MM-dd in BUSINESS_TIMEZONE. */
  startDate: '2026-11-19',
  endDate: '2026-11-29',
  percentOff: 40,
  /** Category names exactly as in src/data/services.json. */
  categories: ['Facials', 'Waxing'],
  /**
   * Services in those categories that stay full price. Brow Lamination &
   * Waxing (brow-lam-wax) IS on sale — only plain brow waxing is excluded.
   * There is no lip wax service yet; add its id here if one is created.
   */
  excludedServiceIds: ['brow-wax', 'chin-wax', 'underarm-wax'],
  /** Extra line appended to a service's description while the sale is live. */
  saleNotes: {
    'chemical-peel': '*Black Friday: $75 per session or $450 for the full 6-session package (reg. $750).*',
  } as Record<string, string>,
  /** Sale name on the hero ribbon; the word "Sale" is added by the design. */
  title: 'Black Friday',
  appliesTo: 'All Facials & Waxing',
  finePrint: 'Excludes brow, lip, chin & underarm waxing',
} as const;

const TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/New_York';

/**
 * Is the sale on at `at`? Server-side only (reads env): pages pass the answer
 * down to client components as a prop so server HTML and hydration agree.
 *
 * PROMO_PREVIEW=true forces it on — for previewing locally before the start
 * date. Never set it in Vercel.
 */
export function isPromoLive(at: Date = new Date()): boolean {
  if (!PROMOTION.active) return false;
  if (process.env.PROMO_PREVIEW === 'true') return true;
  if (Number.isNaN(at.getTime())) return false;
  const day = formatInTimeZone(at, TIMEZONE, 'yyyy-MM-dd');
  return day >= PROMOTION.startDate && day <= PROMOTION.endDate;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 19 – Nov 29" — read straight from the config strings, no time zone math. */
export function promoDateRange(): string {
  const label = (ymd: string) => {
    const [, m, d] = ymd.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}`;
  };
  return `${label(PROMOTION.startDate)} – ${label(PROMOTION.endDate)}`;
}

interface PricedService {
  id: string;
  category: string;
  priceCents: number;
}

/** Is this service part of the sale (ignoring dates)? */
export function isPromoEligible(service: Pick<PricedService, 'id' | 'category'>): boolean {
  if (!(PROMOTION.categories as readonly string[]).includes(service.category)) return false;
  return !(PROMOTION.excludedServiceIds as readonly string[]).includes(service.id);
}

/** Description with the sale note appended while the sale is live. */
export function promoDescription(
  service: { id: string; description: string },
  live: boolean = isPromoLive()
): string {
  const note = live ? PROMOTION.saleNotes[service.id] : undefined;
  return note ? `${service.description} ${note}` : service.description;
}

/**
 * The price a customer pays for one service, in cents. `live` defaults to
 * "is the sale on right now"; client components pass the server's answer.
 */
export function promoPriceCents(service: PricedService, live: boolean = isPromoLive()): number {
  if (!live || !isPromoEligible(service)) return service.priceCents;
  return Math.round((service.priceCents * (100 - PROMOTION.percentOff)) / 100);
}
