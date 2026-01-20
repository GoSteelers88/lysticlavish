'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ChevronLeft,
  CreditCard,
  Lock,
  AlertCircle,
  Shield,
} from 'lucide-react';

interface PaymentFormProps {
  bookingId: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  };
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
  service,
  customerInfo,
  appointmentDateTime,
  onSuccess,
  onBack,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<unknown>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Load Square SDK
  useEffect(() => {
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

      // Process payment
      const paymentResponse = await fetch('/api/payments/square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          sourceId: result.token,
          amountCents: service.priceCents,
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
          <div className="flex justify-between">
            <span className="text-espresso-600">Service</span>
            <span className="font-medium text-espresso-800">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-espresso-600">Duration</span>
            <span className="text-espresso-800">
              {formatDuration(service.durationMinutes)}
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
          <div className="flex justify-between text-base">
            <span className="font-medium text-espresso-900">Total</span>
            <span className="font-serif text-xl text-espresso-900">
              {formatPrice(service.priceCents)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
            {loading ? 'Processing...' : `Pay ${formatPrice(service.priceCents)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
