// ============================================
// Business hours — the ONE place to change them
// ============================================
//
// Everything reads from this: booking availability (slots.ts), the booking
// date picker, the header top bar, the footer, and the contact section.
// Times are 24h "HH:MM" in BUSINESS_TIMEZONE. null = closed.
// Edit, push to main, done — no Vercel env var involved.

export interface BusinessHours {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DaySchedule = Record<DayKey, BusinessHours | null>;

export const BUSINESS_HOURS: DaySchedule = {
  monday: null,
  tuesday: null,
  wednesday: { open: '19:00', close: '21:00' },
  thursday: { open: '19:00', close: '21:00' },
  friday: { open: '19:00', close: '21:00' },
  saturday: { open: '10:00', close: '17:00' },
  sunday: { open: '10:00', close: '15:00' },
};

// ============================================
// Helpers
// ============================================

// Indexed like Date.getDay(): 0 = Sunday
const DAY_KEYS_BY_INDEX: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

// Display order, Monday first
const WEEK: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dayName = (day: DayKey) => capitalize(day);
const shortDayName = (day: DayKey) => capitalize(day.slice(0, 3));

export function dayKeyForIndex(dayIndex: number): DayKey {
  return DAY_KEYS_BY_INDEX[dayIndex];
}

/** True if the business is open on this Date.getDay() index. */
export function isOpenOnDay(dayIndex: number): boolean {
  return BUSINESS_HOURS[dayKeyForIndex(dayIndex)] !== null;
}

/** "19:00" → "7PM" (compact) or "7:00 PM" (full). Keeps minutes when non-zero. */
export function formatTime(hhmm: string, style: 'compact' | 'full' = 'compact'): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = String(m).padStart(2, '0');
  if (style === 'full') return `${hour12}:${minutes} ${period}`;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${minutes}${period}`;
}

function formatRange(hours: BusinessHours, style: 'compact' | 'full'): string {
  const sep = style === 'full' ? ' - ' : '–';
  return `${formatTime(hours.open, style)}${sep}${formatTime(hours.close, style)}`;
}

/** One row per day, Monday first — for the contact section table. */
export function getWeeklyHours(): { day: string; hours: string; closed: boolean }[] {
  return WEEK.map((day) => {
    const hours = BUSINESS_HOURS[day];
    return {
      day: dayName(day),
      hours: hours ? formatRange(hours, 'full') : 'Closed',
      closed: hours === null,
    };
  });
}

interface HoursGroup {
  days: DayKey[];
  hours: BusinessHours | null;
}

/** Consecutive days (Mon→Sun) with identical hours, merged. */
function groupDays(): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const day of WEEK) {
    const hours = BUSINESS_HOURS[day];
    const last = groups[groups.length - 1];
    const same =
      last &&
      (last.hours === null
        ? hours === null
        : hours !== null && last.hours.open === hours.open && last.hours.close === hours.close);
    if (same) last.days.push(day);
    else groups.push({ days: [day], hours });
  }
  return groups;
}

function groupLabel(days: DayKey[], short: boolean): string {
  const name = short ? shortDayName : dayName;
  if (days.length === 1) return name(days[0]);
  return short
    ? `${name(days[0])}–${name(days[days.length - 1])}`
    : `${name(days[0])} - ${name(days[days.length - 1])}`;
}

/** Open days only, e.g. "Wed–Fri 7PM–9PM · Sat 10AM–5PM · Sun 10AM–3PM" — header top bar. */
export function getCompactHoursSummary(): string {
  return groupDays()
    .filter((g) => g.hours)
    .map((g) => `${groupLabel(g.days, true)} ${formatRange(g.hours!, 'compact')}`)
    .join(' · ');
}

/** Open groups first, then closed, e.g. ["Wednesday - Friday: 7PM - 9PM", …, "Monday - Tuesday: Closed"] — footer. */
export function getHoursLines(): string[] {
  const groups = groupDays();
  const open = groups
    .filter((g) => g.hours)
    .map((g) => `${groupLabel(g.days, false)}: ${formatRange(g.hours!, 'compact').replace('–', ' - ')}`);
  const closed = groups
    .filter((g) => !g.hours)
    .map((g) => `${groupLabel(g.days, false)}: Closed`);
  return [...open, ...closed];
}

/** Sentence form, e.g. "Wednesday - Friday 7 PM - 9 PM, Saturday 10 AM - 5 PM, and Sunday 10 AM - 3 PM" — booking page. */
export function getHoursSentence(): string {
  const parts = groupDays()
    .filter((g) => g.hours)
    .map((g) => {
      const t = (s: string) => formatTime(s).replace(/(AM|PM)$/, ' $1');
      return `${groupLabel(g.days, false)} ${t(g.hours!.open)} - ${t(g.hours!.close)}`;
    });
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}
