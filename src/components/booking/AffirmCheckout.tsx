'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, AlertCircle, Lock } from 'lucide-react';

export interface AffirmConfig {
  enabled: boolean;
  publicApiKey: string;
  scriptUrl: string;
  environment: 'sandbox' | 'production';
  minCents: number;
}

interface AffirmCheckoutProps {
  config: AffirmConfig;
  bookingId: string;
  services: {
    id: string;
    name: string;
    priceCents: number;
  }[];
  customerInfo: {
    name: string;
    email: string;
  };
  totalPriceCents: number;
  onSuccess: (result: { paymentId: string; receiptUrl?: string }) => void;
  onBack: () => void;
  /** True while a loan is in flight or approved-but-unconfirmed; the parent locks other payment options. */
  onBusyChange?: (busy: boolean) => void;
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipcode: string;
}

type AffirmCallbacks = {
  // affirm.js delivers `checkout_token` (Affirm's docs call it checkout_id)
  onSuccess: (checkout: { checkout_token?: string; checkout_id?: string }) => void;
  onFail: (error: unknown) => void;
  onValidationError: (error: unknown) => void;
};

type AffirmGlobal = {
  checkout: ((checkoutObject: Record<string, unknown>) => void) & {
    open: (callbacks: AffirmCallbacks) => void;
  };
  ui: { ready: (callback: () => void) => void };
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

let affirmLoad: Promise<AffirmGlobal> | null = null;

/**
 * Load affirm.js using Affirm's official embed snippet, verbatim, so the
 * public key is handed over exactly as Affirm expects. Resolves when ready.
 */
function loadAffirm(publicApiKey: string, scriptUrl: string): Promise<AffirmGlobal> {
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

export function AffirmCheckout({
  config,
  bookingId,
  services,
  customerInfo,
  totalPriceCents,
  onSuccess,
  onBack,
  onBusyChange,
}: AffirmCheckoutProps) {
  const [address, setAddress] = useState<BillingAddress>(() => ({
    ...splitName(customerInfo.name),
    line1: '',
    line2: '',
    city: '',
    state: 'NC',
    zipcode: '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof BillingAddress, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // An approved loan our server hasn't confirmed yet (network/server error).
  // Retrying re-sends this token instead of opening a second Affirm loan.
  const [unconfirmedToken, setUnconfirmedToken] = useState<string | null>(null);

  // While a loan may exist, the customer must not switch to card or leave
  const busy = loading || unconfirmedToken !== null;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof BillingAddress]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BillingAddress, string>> = {};

    if (!address.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!address.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!address.line1.trim()) newErrors.line1 = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!/^[A-Za-z]{2}$/.test(address.state.trim())) {
      newErrors.state = 'Use the 2-letter state code';
    }
    if (!/^\d{5}(-\d{4})?$/.test(address.zipcode.trim())) {
      newErrors.zipcode = 'Enter a 5-digit ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmWithServer = async (checkoutToken: string) => {
    let response: Response | null = null;
    try {
      response = await fetch('/api/payments/affirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, checkoutToken }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Affirm payment failed');
      }

      setUnconfirmedToken(null);
      onSuccess({ paymentId: data.data.payment.id });
    } catch (err) {
      console.error('Affirm confirmation error:', err);

      // A 4xx is a final answer about this loan; anything else may have been
      // a hiccup after Affirm approved it, so the retry must reuse the token.
      const definitive = !!response && response.status >= 400 && response.status < 500;
      setUnconfirmedToken(definitive ? null : checkoutToken);
      setError(
        definitive
          ? err instanceof Error
            ? err.message
            : 'Affirm payment failed. Please try again.'
          : 'Your Affirm loan was approved, but we could not finish your booking. Please tap "Finish booking" to try again — you will not be charged twice.'
      );
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (unconfirmedToken) {
      setLoading(true);
      await confirmWithServer(unconfirmedToken);
      return;
    }

    if (!validate()) return;

    setLoading(true);

    try {
      const affirm = await loadAffirm(config.publicApiKey, config.scriptUrl);
      const origin = window.location.origin;

      // Nothing is shipped, so the customer's address is both billing and shipping
      const contact = {
        name: { first: address.firstName.trim(), last: address.lastName.trim() },
        address: {
          line1: address.line1.trim(),
          ...(address.line2.trim() ? { line2: address.line2.trim() } : {}),
          city: address.city.trim(),
          state: address.state.trim().toUpperCase(),
          zipcode: address.zipcode.trim(),
          country: 'US',
        },
        email: customerInfo.email,
      };

      affirm.checkout({
        merchant: {
          public_api_key: config.publicApiKey,
          user_confirmation_url: `${origin}/booking`,
          user_cancel_url: `${origin}/booking`,
          user_confirmation_url_action: 'POST',
        },
        shipping: contact,
        billing: contact,
        items: services.map((s) => ({
          display_name: s.name,
          sku: s.id,
          unit_price: s.priceCents,
          qty: 1,
          item_url: `${origin}/booking?service=${encodeURIComponent(s.id)}`,
        })),
        metadata: { mode: 'modal' },
        order_id: bookingId,
        currency: 'USD',
        shipping_amount: 0,
        tax_amount: 0,
        total: totalPriceCents,
      });

      affirm.checkout.open({
        onSuccess: (checkout) => {
          const checkoutToken = checkout?.checkout_token || checkout?.checkout_id;
          if (!checkoutToken) {
            console.error('Affirm onSuccess without a checkout token:', checkout);
            setError('Affirm did not return a confirmation. Please try again or pay by card.');
            setLoading(false);
            return;
          }
          confirmWithServer(checkoutToken);
        },
        onFail: () => {
          setError(
            "Affirm checkout wasn't completed. You can try again, or go back and pay the deposit by card."
          );
          setLoading(false);
        },
        onValidationError: (validationError) => {
          console.error('Affirm validation error:', validationError);
          setError('Affirm could not accept these details. Please check your address and try again.');
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Affirm load error:', err);
      setError('Affirm could not be loaded. Please refresh and try again, or pay by card.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <p className="font-sans text-sm font-medium text-espresso-700 mb-1">
          Billing Address
        </p>
        <p className="text-xs text-espresso-500 mb-4">
          Affirm uses this to check your eligibility. Use the name and address on your
          bank or credit records.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={address.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <Input
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={address.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Street address"
            name="line1"
            autoComplete="address-line1"
            value={address.line1}
            onChange={handleChange}
            error={errors.line1}
            required
          />
          <Input
            label="Apt, suite, unit"
            name="line2"
            autoComplete="address-line2"
            value={address.line2}
            onChange={handleChange}
          />
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_6rem_8rem] gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="City"
                name="city"
                autoComplete="address-level2"
                value={address.city}
                onChange={handleChange}
                error={errors.city}
                required
              />
            </div>
            <Input
              label="State"
              name="state"
              autoComplete="address-level1"
              maxLength={2}
              value={address.state}
              onChange={handleChange}
              error={errors.state}
              required
            />
            <Input
              label="ZIP"
              name="zipcode"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              value={address.zipcode}
              onChange={handleChange}
              error={errors.zipcode}
              required
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-espresso-500">
        <Lock className="w-4 h-4" />
        <span>
          Payment options through Affirm are subject to an eligibility check.
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={busy}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          className="flex-1"
        >
          {loading
            ? 'Processing...'
            : unconfirmedToken
              ? 'Finish booking'
              : `Continue with Affirm · ${formatPrice(totalPriceCents)}`}
        </Button>
      </div>
    </form>
  );
}
