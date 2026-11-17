'use client';

/**
 * Browser-side Affirm: one affirm.js load per page, shared by the booking
 * checkout (AffirmCheckout) and the "Pay with Affirm" payment-options button
 * (AffirmButton). Moved verbatim from AffirmCheckout on 2026-11-16.
 */

export interface AffirmClientConfig {
  enabled: boolean;
  publicApiKey: string;
  scriptUrl: string;
  environment: string;
  minCents: number;
}

export type AffirmCallbacks = {
  // affirm.js delivers `checkout_token` (Affirm's docs call it checkout_id)
  onSuccess: (checkout: { checkout_token?: string; checkout_id?: string }) => void;
  onFail: (error: unknown) => void;
  onValidationError: (error: unknown) => void;
};

export type AffirmGlobal = {
  checkout: ((checkoutObject: Record<string, unknown>) => void) & {
    open: (callbacks: AffirmCallbacks) => void;
  };
  ui: {
    ready: (callback: () => void) => void;
    /** Re-scan the page for Affirm elements (modals, messaging). */
    refresh?: () => void;
  };
};

let affirmLoad: Promise<AffirmGlobal> | null = null;

/**
 * Load affirm.js using Affirm's official embed snippet, verbatim, so the
 * public key is handed over exactly as Affirm expects. Resolves when ready.
 */
export function loadAffirm(publicApiKey: string, scriptUrl: string): Promise<AffirmGlobal> {
  if (affirmLoad) return affirmLoad;

  affirmLoad = new Promise<AffirmGlobal>((resolve, reject) => {
    const config = JSON.stringify({
      public_api_key: publicApiKey,
      script: scriptUrl,
      locale: 'en_US',
      country_code: 'USA',
    });

    const snippet = document.createElement('script');
    snippet.text =
      `var _affirm_config = ${config};` +
      '(function(m,g,n,d,a,e,h,c){var b=m[n]||{},k=document.createElement(e),p=document.getElementsByTagName(e)[0],l=function(a,b,c){return function(){a[b]._.push([c,arguments])}};b[d]=l(b,d,"set");var f=b[d];b[a]={};b[a]._=[];f._=[];b._=[];b[a][h]=l(b,a,h);b[c]=function(){b._.push([h,arguments])};a=0;for(c="set add save post open empty reset on off trigger ready setProduct".split(" ");a<c.length;a++)f[c[a]]=l(b,d,c[a]);a=0;for(c=["get","token","url","items"];a<c.length;a++)f[c[a]]=function(){};k.async=!0;k.src=g[e];p.parentNode.insertBefore(k,p);delete g[e];f(g);m[n]=b})(window,_affirm_config,"affirm","checkout","ui","script","ready","jsReady");';
    document.body.appendChild(snippet);

    const timeout = window.setTimeout(() => {
      affirmLoad = null;
      reject(new Error('Affirm took too long to load'));
    }, 15000);

    const affirm = (window as unknown as { affirm?: AffirmGlobal }).affirm;
    if (!affirm) {
      window.clearTimeout(timeout);
      affirmLoad = null;
      reject(new Error('Affirm failed to initialize'));
      return;
    }

    affirm.ui.ready(() => {
      window.clearTimeout(timeout);
      resolve((window as unknown as { affirm: AffirmGlobal }).affirm);
    });
  });

  return affirmLoad;
}

let configLoad: Promise<AffirmClientConfig | null> | null = null;

/** GET /api/payments/affirm once per page; null if Affirm isn't usable. */
export function getAffirmClientConfig(): Promise<AffirmClientConfig | null> {
  if (configLoad) return configLoad;
  configLoad = fetch('/api/payments/affirm')
    .then((r) => r.json())
    .then((j) => (j?.success && j.data?.enabled && j.data.publicApiKey ? (j.data as AffirmClientConfig) : null))
    .catch(() => {
      configLoad = null;
      return null;
    });
  return configLoad;
}
