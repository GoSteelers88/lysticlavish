'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, Star } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-champagne-50 via-champagne-100 to-nude-100" />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-champagne-200/40 rounded-full blur-3xl" />

      {/* Floating accent shapes */}
      <div className="absolute top-1/4 right-1/4 animate-float">
        <Sparkles className="w-8 h-8 text-gold-400" />
      </div>
      <div className="absolute bottom-1/3 left-1/5 animate-float animation-delay-500">
        <Star className="w-6 h-6 text-gold-300" />
      </div>

      {/* Content */}
      <div className="container-luxury relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur rounded-full mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-espresso-700">
              Luxury Beauty Experience
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-display-sm lg:text-display font-serif text-espresso-900 mb-6 animate-fade-in-up">
            Where{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Elegance</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-gold-300/50 -z-0" />
            </span>{' '}
            Meets Self-Care
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-espresso-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            Indulge in premium facials, expert waxing, stunning eye enhancements,
            and flawless makeup artistry. Your journey to radiant beauty begins
            at Lystic Lavish.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Link href="/booking">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                Book Your Treatment
              </Button>
            </Link>
            <Link href="#services">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Explore Services
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex items-center justify-center gap-8 md:gap-12 animate-fade-in animation-delay-500">
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-600">500+</p>
              <p className="text-sm text-espresso-500 mt-1">Happy Clients</p>
            </div>
            <div className="w-px h-12 bg-nude-300" />
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-600">5.0</p>
              <p className="text-sm text-espresso-500 mt-1">Star Rating</p>
            </div>
            <div className="w-px h-12 bg-nude-300" />
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-600">4+</p>
              <p className="text-sm text-espresso-500 mt-1">Years Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-champagne-50 to-transparent" />
    </section>
  );
}
