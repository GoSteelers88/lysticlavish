'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AffirmCheckout, type AffirmConfig } from '@/components/booking/AffirmCheckout';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  AlertCircle,
  Shield,
  CalendarClock,
} from 'lucide-react';

interface PaymentFormProps {
  bookingId: string;
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }[];
  customerInfo: {
    name: string;
    email: string;
  };
  appointmentDateTime: string;
  onSuccess: (result: { paymentId: string; receiptUrl?: string }) => void;
  onBack: () => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
        }>;
      }>;
    };
  }
}

export function PaymentForm({
  bookingId,
  services,
  customerInfo,
  appointmentDateTime,
  onSuccess,
  onBack,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'affirm'>('card');
  const [affirmConfig, setAffirmConfig] = useState<AffirmConfig | null>(null);
  const [affirmBusy, setAffirmBusy] = useState(false);
  const cardRef = useRef<unknown>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const totalPriceCents = services.reduce((sum, s) => sum + s.priceCents, 0);
  const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const depositCents = Math.ceil(totalPriceCents * 0.5);
  const remainingCents = totalPriceCents - depositCents;

  // Affirm is offered on the full price, and only above its minimum
  const affirmEnabled = !!affirmConfig?.enabled;
  const affirmEligible = affirmEnabled && totalPriceCents >= affirmConfig!.minCents;
  const payingWithAffirm = paymentMethod === 'affirm' && affirmEligible;

  // Load Affirm config (the option stays hidden until keys are set)
  useEffect(() => {
    fetch('/api/payments/affirm')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAffirmConfig(data.data);
      })
      .catch((err) => console.error('Error loading Affirm config:', err));
  }, []);

  // Load Square SDK
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadSquareSDK = async () => {
      try {
        // Fetch Square config
        const configResponse = await fetch('/api/payments/square');
        const configData = await configResponse.json();

        if (!configData.success) {
          throw new Error('Failed to load payment configuration');
        }

        const { applicationId, locationId, environment } = configData.data;

        // Load Square Web SDK
        const sdkUrl =
          environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';

        // Check if script already loaded
        if (!document.querySelector(`script[src="${sdkUrl}"]`)) {
          const script = document.createElement('script');
          script.src = sdkUrl;
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Wait for Square to be available
        await new Promise<void>((resolve) => {
          const checkSquare = () => {
            if (window.Square) {
              resolve();
            } else {
              setTimeout(checkSquare, 100);
            }
          };
          checkSquare();
        });

        // Initialize Square payments
        const payments = await window.Square!.payments(applicationId, locationId);
        const card = await payments.card();

        // Attach to container
        if (cardContainerRef.current) {
          await card.attach('#card-container');
          cardRef.current = card;
        }

        setSdkLoading(false);
      } catch (err) {
        console.error('Error loading Square SDK:', err);
        setError('Failed to load payment form. Please refresh and try again.');
        setSdkLoading(false);
      }
    };

    loadSquareSDK();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!cardRef.current) {
        throw new Error('Payment form not ready');
      }

      // Tokenize the card
      const card = cardRef.current as {
        tokenize: () => Promise<{
          status: string;
          token?: string;
          errors?: Array<{ message: string }>;
        }>;
      };
      const result = await card.tokenize();

      if (result.status !== 'OK' || !result.token) {
        const errorMessage =
          result.errors?.[0]?.message || 'Unable to process card';
        throw new Error(errorMessage);
      }

      // Process deposit payment
      const paymentResponse = await fetch('/api/payments/square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          sourceId: result.token,
          amountCents: depositCents,
          serviceIds: services.map((s) => s.id),
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Payment failed');
      }

      onSuccess({
        paymentId: paymentData.data.payment.id,
        receiptUrl: paymentData.data.payment.receiptUrl,
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Payment failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card variant="luxury" padding="md">
        <h3 className="font-serif text-lg text-espresso-900 mb-4">
          Booking Summary
        </h3>
        <div className="space-y-3 text-sm">
          {services.length === 1 ? (
            <div className="flex justify-between">
              <span className="text-espresso-600">Service</span>
              <span className="font-medium text-espresso-800">{services[0].name}</span>
            </div>
          ) : (
            <div>
              <span className="text-espresso-600">Services</span>
              <div className="mt-1 space-y-1">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between">
                    <span className="text-espresso-800 font-medium">• {s.name}</span>
                    <span className="text-espresso-600">{formatPrice(s.priceCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-espresso-600">Duration</span>
            <span className="text-espresso-800">
              {formatDuration(totalDurationMinutes)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-espresso-600">Date & Time</span>
            <span className="text-espresso-800">
              {format(parseISO(appointmentDateTime), 'MMM d, yyyy')} at{' '}
              {format(parseISO(appointmentDateTime), 'h:mm a')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-espresso-600">Client</span>
            <span className="text-espresso-800">{customerInfo.name}</span>
          </div>
          <div className="divider-gold !my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-espresso-600">Service Total</span>
            <span className="text-espresso-800">{formatPrice(totalPriceCents)}</span>
          </div>
          {payingWithAffirm ? (
            <>
              <div className="flex justify-between text-base mt-2">
                <span className="font-medium text-espresso-900">Due Today with Affirm</span>
                <span className="font-serif text-xl text-gold-700">
                  {formatPrice(totalPriceCents)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-espresso-500">Balance due at appointment</span>
                <span className="text-espresso-600">{formatPrice(0)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-base mt-2">
                <span className="font-medium text-espresso-900">Deposit Due Today (50%)</span>
                <span className="font-serif text-xl text-gold-700">
                  {formatPrice(depositCents)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-espresso-500">Remaining balance due at appointment</span>
                <span className="text-espresso-600">{formatPrice(remainingCents)}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Payment Method */}
      {affirmEnabled && (
        <div className="space-y-3">
          <p className="font-sans text-sm font-medium text-espresso-700">Payment Method</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              disabled={loading || affirmBusy}
              aria-pressed={!payingWithAffirm}
              className={cn(
                'flex flex-col items-start justify-start text-left p-4 rounded-xl border-2 transition-colors',
                !payingWithAffirm
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-nude-300 bg-white hover:border-gold-300'
              )}
            >
              <span className="flex items-center gap-2 font-medium text-espresso-900">
                <CreditCard className="w-4 h-4 text-gold-600" />
                Card deposit
              </span>
              <span className="block text-sm text-espresso-600 mt-1">
                Pay {formatPrice(depositCents)} today, the rest at your appointment
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('affirm')}
              disabled={loading || affirmBusy || !affirmEligible}
              aria-pressed={payingWithAffirm}
              className={cn(
                'flex flex-col items-start justify-start text-left p-4 rounded-xl border-2 transition-colors',
                payingWithAffirm
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-nude-300 bg-white hover:border-gold-300',
                !affirmEligible && 'opacity-60 cursor-not-allowed hover:border-nude-300'
              )}
            >
              <span className="flex items-center gap-2 font-medium text-espresso-900">
                <CalendarClock className="w-4 h-4 text-gold-600" />
                Pay over time with Affirm
              </span>
              <span className="block text-sm text-espresso-600 mt-1">
                {affirmEligible
                  ? `Pay the full ${formatPrice(totalPriceCents)} in installments`
                  : `Available on bookings of ${formatPrice(affirmConfig!.minCents)} or more`}
              </span>
            </button>
          </div>
        </div>
      )}

      {payingWithAffirm ? (
        <AffirmCheckout
          config={affirmConfig!}
          bookingId={bookingId}
          services={services}
          customerInfo={customerInfo}
          totalPriceCents={totalPriceCents}
          onSuccess={onSuccess}
          onBack={onBack}
          onBusyChange={setAffirmBusy}
        />
      ) : (
        /* Deposit Policy Notice */
        <div className="flex items-start gap-3 px-4 py-3 bg-gold-50 border border-gold-200 rounded-xl text-sm text-espresso-700">
          <Shield className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-espresso-900">Deposit Policy:</span>{' '}
            Your deposit is fully refundable if you cancel at least 24 hours before your appointment, or it can be applied toward a future booking.
          </p>
        </div>
      )}

      {/* Payment Form — kept mounted (hidden) while Affirm is selected so the Square card field stays attached */}
      <form onSubmit={handleSubmit} className={cn('space-y-6', payingWithAffirm && 'hidden')}>
        <div>
          <label className="block font-sans text-sm font-medium text-espresso-700 mb-3">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Card Details
          </label>

          {/* Square Card Container */}
          <div
            id="card-container"
            ref={cardContainerRef}
            className={cn(
              'min-h-[56px] p-4 rounded-xl border-2 border-nude-300',
              'bg-white transition-colors',
              sdkLoading && 'animate-pulse bg-nude-100'
            )}
          >
            {sdkLoading && (
              <div className="flex items-center justify-center h-8">
                <span className="text-sm text-espresso-500">
                  Loading payment form...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-2 text-xs text-espresso-500">
          <Lock className="w-4 h-4" />
          <span>Your payment info is encrypted and secure</span>
          <Shield className="w-4 h-4 ml-2" />
          <span>Powered by Square</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={sdkLoading || loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : `Pay Deposit ${formatPrice(depositCents)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
