'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Sparkles, Star } from 'lucide-react';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay may be blocked until user interaction — fallback to poster.
    });
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-espresso-950">
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/lystic-hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-contain z-0"
      >
        <source src="/videos/lystic-hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-espresso-900/70 via-espresso-900/55 to-espresso-900/80 z-10" />

      {/* Gold accent glows */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl z-10" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-champagne-200/10 rounded-full blur-3xl z-10" />

      {/* Floating accents */}
      <div className="absolute top-1/4 right-1/4 animate-float z-10">
        <Sparkles className="w-8 h-8 text-gold-300" />
      </div>
      <div className="absolute bottom-1/3 left-1/5 animate-float animation-delay-500 z-10">
        <Star className="w-6 h-6 text-gold-200" />
      </div>

      {/* Content */}
      <div className="container-luxury relative z-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <Image
              src="/lystic-logo-new.png"
              alt="Lystic Lavish Beauty Bar"
              width={600}
              height={240}
              className="h-48 md:h-64 w-auto drop-shadow-2xl"
              priority
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/15 backdrop-blur rounded-full mb-8 border border-white/20 animate-fade-in">
            <Sparkles className="w-4 h-4 text-gold-300 mr-2" />
            <span className="text-sm font-medium text-white">
              Luxury Beauty Experience
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-display-sm lg:text-display font-serif text-white mb-6 animate-fade-in-up drop-shadow-lg">
            Where{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Elegance</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-gold-300/60 -z-0" />
            </span>{' '}
            Meets Self-Care
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-champagne-100 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200 drop-shadow">
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
              <Button variant="outline" size="lg" className="min-w-[200px] bg-white/10 backdrop-blur text-white border-white hover:bg-white hover:text-espresso-900">
                Explore Services
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex items-center justify-center gap-8 md:gap-12 animate-fade-in animation-delay-500">
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-300 drop-shadow">500+</p>
              <p className="text-sm text-champagne-100 mt-1">Happy Clients</p>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-300 drop-shadow">5.0</p>
              <p className="text-sm text-champagne-100 mt-1">Star Rating</p>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <p className="font-serif text-3xl text-gold-300 drop-shadow">2+</p>
              <p className="text-sm text-champagne-100 mt-1">Years Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-champagne-50 to-transparent z-10" />
    </section>
  );
}
