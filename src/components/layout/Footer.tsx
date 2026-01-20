'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
} from 'lucide-react';

const quickLinks = [
  { name: 'Services', href: '/#services' },
  { name: 'Gallery', href: '/#gallery' },
  { name: 'Reviews', href: '/#reviews' },
  { name: 'Policies', href: '/#policies' },
  { name: 'Book Now', href: '/booking' },
];

const services = [
  { name: 'Facials', href: '/#services' },
  { name: 'Waxing', href: '/#services' },
  { name: 'Eye Enhancement', href: '/#services' },
  { name: 'Makeup', href: '/#services' },
];

const socials = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-espresso-900 text-champagne-100">
      {/* Main Footer */}
      <div className="container-luxury py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/lystic logo.webp"
                alt="Lystic Lavish Beauty Bar"
                width={220}
                height={80}
                className="h-20 w-auto brightness-0 invert opacity-90"
              />
            </Link>
            <p className="mt-4 text-champagne-300 text-sm leading-relaxed">
              Where luxury meets self-care. Experience the art of beauty at
              Lystic Lavish Beauty Bar.
            </p>
            <div className="flex items-center space-x-4 mt-6">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-10 h-10 rounded-full',
                    'flex items-center justify-center',
                    'bg-espresso-800 text-champagne-200',
                    'hover:bg-gold-500 hover:text-espresso-900',
                    'transition-all duration-300'
                  )}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg text-champagne-50 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-champagne-300 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif text-lg text-champagne-50 mb-4">
              Our Services
            </h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    href={service.href}
                    className="text-champagne-300 hover:text-gold-400 transition-colors text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg text-champagne-50 mb-4">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+1234567890"
                  className="flex items-start text-champagne-300 hover:text-gold-400 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                  (123) 456-7890
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@lysticlavish.com"
                  className="flex items-start text-champagne-300 hover:text-gold-400 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                  hello@lysticlavish.com
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start text-champagne-300 hover:text-gold-400 transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                  123 Beauty Lane
                  <br />
                  City, State 12345
                </a>
              </li>
              <li className="flex items-start text-champagne-300 text-sm">
                <Clock className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Tue - Fri: 9AM - 6PM</p>
                  <p>Saturday: 10AM - 5PM</p>
                  <p>Sun & Mon: Closed</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-espresso-800">
        <div className="container-luxury py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-champagne-400">
            <p>
              &copy; {currentYear} Lystic Lavish Beauty Bar. All rights reserved.
            </p>
            <p className="flex items-center">
              Made with <Heart className="w-4 h-4 mx-1 text-gold-500" /> for
              beauty lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
