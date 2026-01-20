'use client';

import { useState } from 'react';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Clock, Check, ChevronRight } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
}

interface ServiceSelectionProps {
  services: Record<string, Service[]>;
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
  onNext: () => void;
}

export function ServiceSelection({
  services,
  selectedServiceId,
  onSelect,
  onNext,
}: ServiceSelectionProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(services)[0] || '');
  const categories = Object.keys(services);

  const selectedService = selectedServiceId
    ? Object.values(services)
        .flat()
        .find((s) => s.id === selectedServiceId)
    : null;

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              'transition-all duration-200',
              activeCategory === category
                ? 'bg-espresso-800 text-champagne-100'
                : 'bg-nude-100 text-espresso-700 hover:bg-nude-200'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services[activeCategory]?.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border-2',
                'transition-all duration-200',
                isSelected
                  ? 'border-gold-500 bg-gold-50 shadow-soft'
                  : 'border-nude-200 bg-white hover:border-gold-300 hover:shadow-soft'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-espresso-900">{service.name}</h3>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-espresso-600 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center text-espresso-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl text-espresso-900">
                    {formatPrice(service.priceCents)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Service Summary & Next Button */}
      {selectedService && (
        <Card variant="luxury" padding="md" className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-espresso-500">Selected Service</p>
              <p className="font-medium text-espresso-900">{selectedService.name}</p>
              <p className="text-sm text-espresso-600">
                {formatDuration(selectedService.durationMinutes)} •{' '}
                {formatPrice(selectedService.priceCents)}
              </p>
            </div>
            <Button variant="primary" onClick={onNext}>
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
