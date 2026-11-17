'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { getAffirmClientConfig, loadAffirm } from '@/lib/affirm/browser';

/**
 * "Pay with Affirm" — opens Affirm's payment-options modal (affirm.js
 * `affirm-product-modal`): example payments for an amount the customer can
 * edit, Pay in 4 and monthly plans. No backend; Affirm runs the modal.
 *
 * Prequalification ("check your purchasing power") is an Affirm account
 * setting — measured OFF on 2026-11-16 in both sandbox and production. Once
 * Affirm enables it, it appears inside this same modal with no code change;
 * then the subtitle below can say "Check your purchasing power".
 *
 * Renders nothing if Affirm isn't configured or affirm.js fails to load.
 */
type Variant = 'header' | 'block' | 'link';

const AFFIRM_INDIGO = '#4A4AF4';
/** Official Affirm logo, served by Affirm. */
const AFFIRM_LOGO_SRC = 'https://cdn-assets.affirm.com/images/blue_logo-transparent_bg.png';
/** Starting amount in the modal's calculator (cents); customers can edit it. */
const EXAMPLE_AMOUNT_CENTS = 10000;

export function AffirmButton({
  variant = 'header',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAffirmClientConfig()
      .then((config) => {
        if (!config) throw new Error('Affirm not configured');
        return loadAffirm(config.publicApiKey, config.scriptUrl);
      })
      .then((affirm) => {
        if (cancelled) return;
        // Bind affirm.js to this element (it scans for .affirm-site-modal).
        affirm.ui.refresh?.();
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  // affirm.js listens for clicks on the element; give keyboard users the same.
  const onKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ref.current?.click();
    }
  };

  const shared = {
    ref,
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown,
    'data-page-type': 'product',
    'data-amount': String(EXAMPLE_AMOUNT_CENTS),
    'aria-label': 'Pay over time with Affirm — see payment options',
    'aria-disabled': !ready,
  };

  // Affirm's PNG carries ~15% empty space left/right (measured: ink spans
  // x 141-806 of 948). A 2.32:1 box with object-fit: cover crops exactly to
  // the logo, so it sits snug against "Pay with".
  const affirmLogo = (size: 'sm' | 'md') => {
    const h = size === 'sm' ? 1.05 : 1.2; // em
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Affirm-hosted brand asset
      <img
        src={AFFIRM_LOGO_SRC}
        alt="Affirm"
        className="inline-block object-cover"
        style={{ height: `${h}em`, width: `${(h * 2.32).toFixed(2)}em`, verticalAlign: '-0.12em' }}
      />
    );
  };

  if (variant === 'link') {
    return (
      <a
        {...shared}
        className={cn(
          'affirm-product-modal cursor-pointer text-sm text-espresso-500 underline-offset-2 hover:underline',
          className
        )}
      >
        or pay over time with {affirmLogo('sm')}
      </a>
    );
  }

  return (
    <a
      {...shared}
      className={cn(
        'affirm-product-modal inline-flex cursor-pointer select-none flex-col items-center justify-center',
        'rounded-xl border border-espresso-200 bg-white text-center leading-tight',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        variant === 'header' ? 'h-11 gap-0.5 px-4' : 'w-full gap-1 px-6 py-3',
        !ready && 'opacity-70',
        className
      )}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = AFFIRM_INDIGO)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      <span className={cn('leading-none text-espresso-900', variant === 'header' ? 'text-sm' : 'text-base')}>
        Pay with {affirmLogo('md')}
      </span>
      <span className="text-2xs leading-none text-espresso-500">See payment options</span>
    </a>
  );
}
