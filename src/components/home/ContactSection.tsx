'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react';

const businessHours = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
  { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
  { day: 'Thursday', hours: '9:00 AM - 7:00 PM' },
  { day: 'Friday', hours: '9:00 AM - 7:00 PM' },
  { day: 'Saturday', hours: '10:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
];

const contactInfo = [
  {
    icon: Phone,
    label: 'Phone',
    value: '(123) 456-7890',
    href: 'tel:+1234567890',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@lysticlavish.com',
    href: 'mailto:hello@lysticlavish.com',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: '123 Beauty Lane, City, ST 12345',
    href: 'https://maps.google.com',
  },
];

const socials = [
  {
    name: 'Instagram',
    icon: Instagram,
    href: 'https://instagram.com',
    handle: '@lysticlavish',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://facebook.com',
    handle: '/lysticlavish',
  },
];

export function ContactSection() {
  // Get current day for highlighting
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <section id="contact" className="section bg-white">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-gold-100 rounded-full mb-4">
            <MessageCircle className="w-4 h-4 text-gold-600 mr-2" />
            <span className="text-sm font-medium text-gold-800">Get in Touch</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso-900 mb-4">
            Visit Us or Reach Out
          </h2>
          <p className="text-espresso-600">
            We'd love to hear from you! Book your appointment or get in touch
            with any questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info & Hours */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <Card variant="default" padding="md">
              <h3 className="font-serif text-xl text-espresso-900 mb-6">
                Contact Information
              </h3>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-nude-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-200 transition-colors">
                      <item.icon className="w-5 h-5 text-gold-700" />
                    </div>
                    <div>
                      <p className="text-sm text-espresso-500">{item.label}</p>
                      <p className="font-medium text-espresso-800">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-6 pt-6 border-t border-nude-200">
                <p className="text-sm text-espresso-600 mb-3">Follow us:</p>
                <div className="flex gap-3">
                  {socials.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-2 px-4 py-2',
                        'bg-nude-100 rounded-full',
                        'hover:bg-gold-100 transition-colors'
                      )}
                    >
                      <social.icon className="w-4 h-4 text-espresso-700" />
                      <span className="text-sm text-espresso-700">
                        {social.handle}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </Card>

            {/* Business Hours */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-gold-600" />
                <h3 className="font-serif text-xl text-espresso-900">
                  Business Hours
                </h3>
              </div>
              <div className="space-y-2">
                {businessHours.map((item) => (
                  <div
                    key={item.day}
                    className={cn(
                      'flex justify-between py-2 px-3 rounded-lg',
                      item.day === today && 'bg-gold-50'
                    )}
                  >
                    <span
                      className={cn(
                        'font-medium',
                        item.day === today ? 'text-gold-800' : 'text-espresso-700'
                      )}
                    >
                      {item.day}
                      {item.day === today && (
                        <span className="ml-2 text-xs text-gold-600">(Today)</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        item.hours === 'Closed'
                          ? 'text-espresso-400'
                          : 'text-espresso-600'
                      )}
                    >
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Map & CTA */}
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden bg-nude-100">
              {/* Replace with actual Google Maps embed */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                  <p className="text-espresso-600">
                    Interactive map would go here
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-600 hover:text-gold-700 text-sm underline mt-2 inline-block"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <Card variant="luxury" padding="lg" className="text-center">
              <h3 className="font-serif text-2xl text-espresso-900 mb-3">
                Ready to Glow?
              </h3>
              <p className="text-espresso-600 mb-6">
                Book your luxury treatment today and experience the
                Lystic Lavish difference.
              </p>
              <Link href="/booking">
                <Button variant="primary" size="lg" fullWidth>
                  Book Your Appointment
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
