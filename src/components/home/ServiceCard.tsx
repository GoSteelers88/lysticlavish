'use client';

import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, ArrowRight } from 'lucide-react';

export interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category?: string;
  onSelect?: (id: string) => void;
  featured?: boolean;
}

export function ServiceCard({
  id,
  name,
  description,
  durationMinutes,
  priceCents,
  category,
  onSelect,
  featured = false,
}: ServiceCardProps) {
  return (
    <Card
      variant={featured ? 'luxury' : 'hover'}
      padding="md"
      className={cn(
        'group relative h-full flex flex-col',
        featured && 'ring-2 ring-gold-300/50'
      )}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute -top-3 left-6">
          <span className="badge-gold text-2xs">Popular</span>
        </div>
      )}

      {/* Category Tag */}
      {category && (
        <span className="badge-neutral mb-3 self-start">{category}</span>
      )}

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-serif text-lg text-espresso-900 mb-2 group-hover:text-gold-700 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-espresso-600 line-clamp-3 mb-4">
          {description}
        </p>
      </div>

      {/* Meta & Action */}
      <div className="mt-auto pt-4 border-t border-nude-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-espresso-500 text-sm">
            <Clock className="w-4 h-4 mr-1.5" />
            {formatDuration(durationMinutes)}
          </div>
          <span className="font-serif text-xl text-espresso-900">
            {formatPrice(priceCents)}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => onSelect?.(id)}
          className="group/btn"
        >
          Book Now
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </Card>
  );
}

// Compact version for lists
export function ServiceCardCompact({
  id,
  name,
  durationMinutes,
  priceCents,
  onSelect,
}: Pick<ServiceCardProps, 'id' | 'name' | 'durationMinutes' | 'priceCents' | 'onSelect'>) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={cn(
        'w-full flex items-center justify-between p-4',
        'bg-white rounded-xl border border-nude-200',
        'hover:border-gold-400 hover:shadow-soft',
        'transition-all duration-200 text-left'
      )}
    >
      <div>
        <h4 className="font-medium text-espresso-800">{name}</h4>
        <div className="flex items-center text-sm text-espresso-500 mt-1">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {formatDuration(durationMinutes)}
        </div>
      </div>
      <span className="font-serif text-lg text-espresso-900">
        {formatPrice(priceCents)}
      </span>
    </button>
  );
}
