'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Clock, Check, ChevronRight, X } from 'lucide-react';

function ServiceRow({
  service,
  isSelected,
  isComingSoon,
  onToggle,
}: {
  service: Service;
  isSelected: boolean;
  isComingSoon: boolean;
  onToggle: (service: Service) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      role="button"
      tabIndex={isComingSoon ? -1 : 0}
      onClick={() => !isComingSoon && onToggle(service)}
      onKeyDown={(e) => e.key === 'Enter' && !isComingSoon && onToggle(service)}
      className={cn(
        'w-full text-left rounded-2xl border-2 overflow-hidden',
        'transition-all duration-200',
        isComingSoon
          ? 'border-nude-200 opacity-60 cursor-not-allowed'
          : isSelected
          ? 'border-gold-500 shadow-soft cursor-pointer'
          : 'border-nude-200 hover:border-gold-300 hover:shadow-soft cursor-pointer'
      )}
    >
      <div className="flex">
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
              <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
        <div className={cn(
          'flex-1 p-4 flex flex-col justify-center',
          isSelected && !isComingSoon ? 'bg-gold-50' : 'bg-white'
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-espresso-900 leading-snug">{service.name}</h3>
                {isComingSoon ? (
                  <span className="px-2 py-0.5 rounded-full bg-nude-200 text-espresso-500 text-xs font-medium flex-shrink-0">
                    Coming Soon
                  </span>
                ) : isSelected && (
                  <span className="px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 text-xs font-medium flex-shrink-0">
                    Added
                  </span>
                )}
              </div>
              <p className={cn('text-sm text-espresso-600 mt-1', !expanded && 'line-clamp-2')}>
                {service.description}
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-gold-600 hover:text-gold-800 font-medium mt-1 transition-colors"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
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
    </div>
  );
}

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
  selectedServices: Service[];
  onToggle: (services: Service[]) => void;
  onNext: () => void;
}

export function ServiceSelection({
  services,
  selectedServices,
  onToggle,
  onNext,
}: ServiceSelectionProps) {
  const [activeCategory, setActiveCategory] = useState('');
  const categories = Object.keys(services);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const selectedIds = new Set(selectedServices.map((s) => s.id));

  const handleToggle = (service: Service) => {
    if (selectedIds.has(service.id)) {
      onToggle(selectedServices.filter((s) => s.id !== service.id));
    } else {
      onToggle([...selectedServices, service]);
    }
  };

  const totalPriceCents = selectedServices.reduce((sum, s) => sum + s.priceCents, 0);
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

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

      {/* Facial First-Time Client Notice */}
      {activeCategory === 'Facials' && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-gold-300 bg-gold-50">
          <p className="text-sm text-espresso-700 leading-relaxed">
            <span className="font-semibold text-espresso-900">First-Time Facial Clients:</span>{' '}
            A skin assessment is required for all first-time facial clients. Please book under the <span className="font-medium">Mini Facial</span> or <span className="font-medium">Basic Facial</span> for your first 1-2 visits. Each client&apos;s skin will be analyzed and assessed to create a custom facial based on skin type.
          </p>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-3">
        {services[activeCategory]?.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            isSelected={selectedIds.has(service.id)}
            isComingSoon={service.category === 'Makeup'}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Selected Services Summary & Next Button */}
      {selectedServices.length > 0 && (
        <Card variant="luxury" padding="md" className="mt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-espresso-700">
                {selectedServices.length === 1 ? '1 service selected' : `${selectedServices.length} services selected`}
              </p>
              <div className="text-right">
                <p className="text-xs text-espresso-500">{formatDuration(totalDurationMinutes)} total</p>
                <p className="font-serif text-lg text-espresso-900">{formatPrice(totalPriceCents)}</p>
              </div>
            </div>

            {/* Selected service chips */}
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-sm"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => handleToggle(s)}
                    className="ml-1 text-gold-600 hover:text-gold-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <Button variant="primary" onClick={onNext} fullWidth>
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
