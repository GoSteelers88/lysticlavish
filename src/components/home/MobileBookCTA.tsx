'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';

export function MobileBookCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white/95 backdrop-blur-lg border-t border-nude-200',
        'p-4 transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-serif text-espresso-900">Ready to book?</p>
          <p className="text-sm text-espresso-500">Book your treatment today</p>
        </div>
        <Link href="/booking">
          <Button variant="primary" size="md">
            <Calendar className="w-4 h-4 mr-2" />
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
