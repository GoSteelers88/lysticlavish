'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  image?: string;
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
  const [activeCategory, setActiveCategory] = useState('');
  const categories = Object.keys(services);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

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
          const isComingSoon = service.category === 'Makeup';

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => !isComingSoon && onSelect(service)}
              disabled={isComingSoon}
              className={cn(
                'w-full text-left rounded-2xl border-2 overflow-hidden',
                'transition-all duration-200',
                isComingSoon
                  ? 'border-nude-200 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-gold-500 shadow-soft'
                  : 'border-nude-200 hover:border-gold-300 hover:shadow-soft'
              )}
            >
              <div className="flex">
                {/* Image Section */}
                {service.image && (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className={cn('object-cover', isComingSoon && 'grayscale')}
                      sizes="(max-width: 640px) 96px, 128px"
                    />
                    {isSelected && !isComingSoon && (
                      <div className="absolute inset-0 bg-gold-500/20" />
                    )}
                  </div>
                )}
                {/* Content Section */}
                <div className={cn(
                  'flex-1 p-4 flex flex-col justify-center',
                  isSelected && !isComingSoon ? 'bg-gold-50' : 'bg-white'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-espresso-900 truncate">{service.name}</h3>
                        {isComingSoon ? (
                          <span className="px-2 py-0.5 rounded-full bg-nude-200 text-espresso-500 text-xs font-medium flex-shrink-0">
                            Coming Soon
                          </span>
                        ) : isSelected && (
                          <span className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
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
                    <div className="text-right flex-shrink-0">
                      <span className="font-serif text-xl text-espresso-900">
                        {formatPrice(service.priceCents)}
                      </span>
                    </div>
                  </div>
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
