'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { BookingProgress, bookingSteps } from '@/components/booking/BookingProgress';
import { ServiceSelection, Service } from '@/components/booking/ServiceSelection';
import { CustomerInfoForm, CustomerInfo } from '@/components/booking/CustomerInfoForm';
import { TimeSelection } from '@/components/booking/TimeSelection';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface BookingState {
  step: number;
  selectedService: Service | null;
  customerInfo: CustomerInfo;
  selectedDateTime: string | null;
  bookingId: string | null;
  paymentResult: { paymentId: string; receiptUrl?: string } | null;
}

const initialCustomerInfo: CustomerInfo = {
  name: '',
  email: '',
  phone: '',
  notes: '',
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get('service');

  const [state, setState] = useState<BookingState>({
    step: 0,
    selectedService: null,
    customerInfo: initialCustomerInfo,
    selectedDateTime: null,
    bookingId: null,
    paymentResult: null,
  });

  const [services, setServices] = useState<Record<string, Service[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services?grouped=true');
        const data = await response.json();

        if (data.success) {
          setServices(data.data);

          // If preselected service, find and select it
          if (preSelectedService) {
            const allServices = Object.values(data.data).flat() as Service[];
            const service = allServices.find((s) => s.id === preSelectedService);
            if (service) {
              setState((prev) => ({ ...prev, selectedService: service }));
            }
          }
        } else {
          setError('Failed to load services');
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Unable to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [preSelectedService]);

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, step }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceSelect = (service: Service) => {
    setState((prev) => ({ ...prev, selectedService: service }));
  };

  const handleCustomerInfoSubmit = (info: CustomerInfo) => {
    setState((prev) => ({ ...prev, customerInfo: info }));
    goToStep(2);
  };

  const handleTimeSelect = (dateTime: string) => {
    setState((prev) => ({ ...prev, selectedDateTime: dateTime }));
  };

  const handleTimeConfirm = async () => {
    // Create booking
    try {
      setLoading(true);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: state.selectedService!.id,
          customerName: state.customerInfo.name,
          customerEmail: state.customerInfo.email,
          customerPhone: state.customerInfo.phone,
          appointmentDatetime: state.selectedDateTime,
          notes: state.customerInfo.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({ ...prev, bookingId: data.data.booking.id }));
        goToStep(3);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: { paymentId: string; receiptUrl?: string }) => {
    setState((prev) => ({ ...prev, paymentResult: result }));
    goToStep(4);
  };

  // Render loading state
  if (loading && state.step === 0 && Object.keys(services).length === 0) {
    return (
      <div className="min-h-screen bg-champagne-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin mx-auto" />
          <p className="mt-4 text-espresso-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-champagne-50">
      {/* Header */}
      <header className="bg-white border-b border-nude-200 sticky top-0 z-40">
        <div className="container-luxury py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 text-espresso-600" />
              <Image
                src="/lystic logo.webp"
                alt="Lystic Lavish"
                width={180}
                height={65}
                className="h-14 w-auto"
              />
            </Link>
            <span className="text-sm text-espresso-500">Book an Appointment</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-luxury py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          {state.step < 4 && (
            <div className="mb-8">
              <BookingProgress currentStep={state.step} steps={bookingSteps} />
            </div>
          )}

          {/* Step Content */}
          <Card variant="default" padding="lg" className="animate-fade-in">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
                <button
                  className="ml-2 underline hover:no-underline"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Step 0: Service Selection */}
            {state.step === 0 && (
              <ServiceSelection
                services={services}
                selectedServiceId={state.selectedService?.id || null}
                onSelect={handleServiceSelect}
                onNext={() => goToStep(1)}
              />
            )}

            {/* Step 1: Customer Info */}
            {state.step === 1 && (
              <CustomerInfoForm
                initialData={state.customerInfo}
                onSubmit={handleCustomerInfoSubmit}
                onBack={() => goToStep(0)}
              />
            )}

            {/* Step 2: Time Selection */}
            {state.step === 2 && state.selectedService && (
              <TimeSelection
                serviceId={state.selectedService.id}
                selectedDateTime={state.selectedDateTime}
                onSelect={handleTimeSelect}
                onNext={handleTimeConfirm}
                onBack={() => goToStep(1)}
              />
            )}

            {/* Step 3: Payment */}
            {state.step === 3 && state.selectedService && state.bookingId && (
              <PaymentForm
                bookingId={state.bookingId}
                service={{
                  id: state.selectedService.id,
                  name: state.selectedService.name,
                  durationMinutes: state.selectedService.durationMinutes,
                  priceCents: state.selectedService.priceCents,
                }}
                customerInfo={{
                  name: state.customerInfo.name,
                  email: state.customerInfo.email,
                }}
                appointmentDateTime={state.selectedDateTime!}
                onSuccess={handlePaymentSuccess}
                onBack={() => goToStep(2)}
              />
            )}

            {/* Step 4: Confirmation */}
            {state.step === 4 &&
              state.selectedService &&
              state.bookingId &&
              state.paymentResult && (
                <BookingConfirmation
                  booking={{
                    id: state.bookingId,
                    customerName: state.customerInfo.name,
                    customerEmail: state.customerInfo.email,
                    customerPhone: state.customerInfo.phone,
                    appointmentDatetime: state.selectedDateTime!,
                  }}
                  service={{
                    name: state.selectedService.name,
                    durationMinutes: state.selectedService.durationMinutes,
                    priceCents: state.selectedService.priceCents,
                  }}
                  payment={state.paymentResult}
                />
              )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-nude-200 bg-white py-6 mt-auto">
        <div className="container-luxury text-center text-sm text-espresso-500">
          <p>
            Need help? Call{' '}
            <a href="tel:+1234567890" className="text-gold-600 hover:underline">
              (123) 456-7890
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
