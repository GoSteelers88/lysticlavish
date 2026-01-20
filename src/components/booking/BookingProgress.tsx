'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface BookingStep {
  id: string;
  name: string;
  shortName?: string;
}

export const bookingSteps: BookingStep[] = [
  { id: 'service', name: 'Choose Service', shortName: 'Service' },
  { id: 'info', name: 'Your Information', shortName: 'Info' },
  { id: 'time', name: 'Select Time', shortName: 'Time' },
  { id: 'payment', name: 'Payment', shortName: 'Pay' },
  { id: 'confirmation', name: 'Confirmation', shortName: 'Done' },
];

interface BookingProgressProps {
  currentStep: number;
  steps?: BookingStep[];
}

export function BookingProgress({
  currentStep,
  steps = bookingSteps,
}: BookingProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'font-medium text-sm transition-all duration-300',
                    isCompleted
                      ? 'bg-gold-500 text-espresso-900'
                      : isCurrent
                      ? 'bg-espresso-800 text-white ring-4 ring-espresso-200'
                      : 'bg-nude-200 text-espresso-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isCurrent
                      ? 'text-espresso-900'
                      : isCompleted
                      ? 'text-gold-700'
                      : 'text-espresso-400'
                  )}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors duration-300',
                    index < currentStep ? 'bg-gold-500' : 'bg-nude-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="flex items-center gap-1.5 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                index <= currentStep ? 'bg-gold-500' : 'bg-nude-200'
              )}
            />
          ))}
        </div>

        {/* Current Step Label */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-espresso-500">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-espresso-800">
            {steps[currentStep]?.name}
          </span>
        </div>
      </div>
    </div>
  );
}
