'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Menu, X, Phone, Clock, MapPin } from 'lucide-react';

const navigation = [
  { name: 'Services', href: '/#services' },
  { name: 'Gallery', href: '/#gallery' },
  { name: 'Reviews', href: '/#reviews' },
  { name: 'Policies', href: '/#policies' },
  { name: 'Contact', href: '/#contact' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Top Bar */}
      <div className="hidden lg:block bg-espresso-900 text-champagne-100">
        <div className="container-luxury py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <a
                href="tel:+1234567890"
                className="flex items-center hover:text-gold-400 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                (123) 456-7890
              </a>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Tue-Sat: 9AM - 6PM
              </span>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-gold-400 transition-colors"
            >
              <MapPin className="w-4 h-4 mr-2" />
              123 Beauty Lane, City, ST 12345
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-soft'
            : 'bg-champagne-50'
        )}
      >
        <div className="container-luxury">
          <nav className="flex items-center justify-between h-24 lg:h-32">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/lystic logo.webp"
                alt="Lystic Lavish Beauty Bar"
                width={280}
                height={100}
                className="h-20 lg:h-24 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="link-nav text-sm tracking-wide"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <Link href="/booking">
                <Button variant="primary" size="md">
                  Book Now
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-espresso-700 hover:text-gold-600 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'lg:hidden fixed inset-x-0 top-24 bottom-0',
            'bg-white/98 backdrop-blur-lg',
            'transition-all duration-300 ease-luxury',
            isMobileMenuOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
        >
          <div className="container-luxury py-8 flex flex-col h-full">
            <nav className="flex-1 space-y-2">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block py-4 px-4 text-lg font-medium text-espresso-800',
                    'rounded-xl hover:bg-nude-100 transition-colors',
                    'animate-fade-in-up',
                    `animation-delay-${(index + 1) * 100}`
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="pt-6 border-t border-nude-200 space-y-4 animate-fade-in-up animation-delay-500">
              <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth size="lg">
                  Book Your Appointment
                </Button>
              </Link>

              <div className="flex items-center justify-center space-x-6 text-sm text-espresso-600">
                <a href="tel:+1234567890" className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </a>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
