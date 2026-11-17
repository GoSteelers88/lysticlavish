import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PROMOTION, promoDateRange, promoStartLabel } from '@/config/promotions';

/** Gold satin: darker edges, a bright sheen just left of centre. */
const GOLD_SATIN =
  'linear-gradient(100deg, #967824 0%, #D4AF37 16%, #FFE070 40%, #FFEDA3 48%, #D4AF37 66%, #B8962E 86%, #967824 100%)';

/** Hanging ribbon's swallowtail: a V cut 44px up into the bottom edge. */
const SWALLOWTAIL = 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 44px), 0 100%)';

/** Band ribbon's notched ends: a V cut 16px into each side. */
const NOTCHED_ENDS =
  'polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%, 16px 50%)';

/** Black satin gift bow that sits on top of the hanging ribbon. */
function Bow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 92" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sale-bow-satin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#463831" />
          <stop offset="0.45" stopColor="#231C19" />
          <stop offset="1" stopColor="#0B0706" />
        </linearGradient>
      </defs>
      {/* tails */}
      <path d="M64 46 L46 88 L56 82 L61 92 L71 50 Z" fill="#150F0D" stroke="#D4AF37" strokeWidth="1.5" />
      <path d="M76 46 L94 88 L84 82 L79 92 L69 50 Z" fill="#231C19" stroke="#D4AF37" strokeWidth="1.5" />
      {/* loops */}
      <path
        d="M70 44 C52 12 12 4 9 30 C6 54 44 58 70 44 Z"
        fill="url(#sale-bow-satin)"
        stroke="#D4AF37"
        strokeWidth="1.75"
      />
      <path
        d="M70 44 C88 12 128 4 131 30 C134 54 96 58 70 44 Z"
        fill="url(#sale-bow-satin)"
        stroke="#D4AF37"
        strokeWidth="1.75"
      />
      {/* inner folds */}
      <path d="M66 42 C52 26 28 20 25 31 C23 41 46 45 66 42 Z" fill="#000" opacity="0.45" />
      <path d="M74 42 C88 26 112 20 115 31 C117 41 94 45 74 42 Z" fill="#000" opacity="0.45" />
      {/* knot */}
      <rect x="58" y="32" width="24" height="24" rx="8" fill="url(#sale-bow-satin)" stroke="#D4AF37" strokeWidth="1.75" />
    </svg>
  );
}

/**
 * xl+ : a gold ribbon hanging from the top of the hero, in the dark gutter
 * beside the portrait video. Positioning comes from the parent.
 */
export function SaleRibbonHanging({
  className,
  teaser = false,
}: {
  className?: string;
  /** Before the sale starts: announce it, no Book Now (prices are still regular). */
  teaser?: boolean;
}) {
  return (
    <aside
      aria-label={`${PROMOTION.title} sale`}
      className={className}
      style={{ filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.55))' }}
    >
      <div
        className="relative px-7 pt-24 pb-20 text-center text-espresso-950"
        style={{ background: GOLD_SATIN, clipPath: SWALLOWTAIL }}
      >
        {/* stitching along both edges */}
        <div className="pointer-events-none absolute inset-y-0 left-2 border-l-2 border-dashed border-espresso-950/25" />
        <div className="pointer-events-none absolute inset-y-0 right-2 border-r-2 border-dashed border-espresso-950/25" />

        <p className="text-2xs font-semibold uppercase tracking-[0.4em] text-espresso-800">
          {teaser ? 'Coming Soon' : 'Limited Time'}
        </p>
        <h2 className="mt-3 font-serif text-4xl 2xl:text-5xl leading-[1.05]">
          {PROMOTION.title}
        </h2>
        <p className="mt-2 text-sm font-bold uppercase tracking-[0.6em]">Sale</p>

        <div className="mx-auto my-5 flex items-center justify-center gap-2 text-espresso-950/60">
          <span className="h-px w-8 bg-current" />
          <Sparkles className="h-4 w-4" />
          <span className="h-px w-8 bg-current" />
        </div>

        <p className="font-serif leading-none">
          <span className="text-6xl 2xl:text-7xl">{PROMOTION.percentOff}%</span>
          <span className="ml-1 text-2xl uppercase">Off</span>
        </p>
        <p className="mt-3 text-lg font-medium">{PROMOTION.appliesTo}*</p>

        {teaser ? (
          <p className="mt-6 inline-flex w-full items-center justify-center rounded-full border-2 border-espresso-950 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] text-espresso-950">
            Starts {promoStartLabel()}
          </p>
        ) : (
          <Link
            href="/booking"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-espresso-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300 transition-colors hover:bg-black"
          >
            Book Now
          </Link>
        )}
        <p className="mt-3 text-2xs leading-snug text-espresso-800">*{PROMOTION.finePrint}</p>
        <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.2em] text-espresso-950">
          {promoDateRange()}
        </p>
      </div>

      <Bow className="pointer-events-none absolute left-1/2 top-3 w-28 -translate-x-1/2" />
    </aside>
  );
}

/**
 * Below xl: a ribbon band above the hero (phones, tablets, small windows),
 * where the video fills the width and there is no side gutter.
 */
export function SaleRibbonBand({
  className,
  teaser = false,
}: {
  className?: string;
  /** Before the sale starts: announce it, not a booking link (prices are still regular). */
  teaser?: boolean;
}) {
  const ribbonClass = 'relative mx-auto block max-w-xl';
  const ribbonStyle = { filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' };
  const ribbon = (
          <div
            className="px-9 py-2.5 text-center text-espresso-950"
            style={{ background: GOLD_SATIN, clipPath: NOTCHED_ENDS }}
          >
            <p className="flex items-center justify-center gap-1.5 text-2xs font-bold uppercase tracking-[0.3em] text-espresso-800">
              <Sparkles className="h-3 w-3" />
              {PROMOTION.title} Sale
              <Sparkles className="h-3 w-3" />
            </p>
            <p className="mt-0.5 font-serif text-lg leading-tight">
              <span className="font-bold">{PROMOTION.percentOff}% Off</span> {PROMOTION.appliesTo}*
            </p>
            <p className="mt-0.5 text-[9px] leading-tight text-espresso-800">
              *{PROMOTION.finePrint}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold leading-tight text-espresso-950">
              {teaser ? (
                <>Starts {promoStartLabel()} · Through {promoDateRange().split(' – ')[1]}</>
              ) : (
                <>
                  {promoDateRange()} ·{' '}
                  <span className="underline underline-offset-2">Book now</span>
                </>
              )}
            </p>
          </div>
  );

  return (
    <div className={className}>
      <div className="bg-espresso-950 px-2 py-3">
        {teaser ? (
          <div className={ribbonClass} style={ribbonStyle}>
            {ribbon}
          </div>
        ) : (
          <Link href="/booking" className={ribbonClass} style={ribbonStyle}>
            {ribbon}
          </Link>
        )}
      </div>
    </div>
  );
}
