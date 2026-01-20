'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Home,
} from 'lucide-react';

interface BookingConfirmationProps {
  booking: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    appointmentDatetime: string;
  };
  service: {
    name: string;
    durationMinutes: number;
    priceCents: number;
  };
  payment: {
    paymentId: string;
    receiptUrl?: string;
  };
}

export function BookingConfirmation({
  booking,
  service,
  payment,
}: BookingConfirmationProps) {
  return (
    <div className="space-y-8 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>

      {/* Success Message */}
      <div className="animate-fade-in-up animation-delay-200">
        <h2 className="font-serif text-2xl md:text-3xl text-espresso-900 mb-3">
          Booking Confirmed!
        </h2>
        <p className="text-espresso-600">
          Thank you for booking with Lystic Lavish Beauty Bar.
          <br />A confirmation email has been sent to{' '}
          <span className="font-medium">{booking.customerEmail}</span>
        </p>
      </div>

      {/* Booking Details Card */}
      <Card
        variant="luxury"
        padding="lg"
        className="text-left animate-fade-in-up animation-delay-300"
      >
        <h3 className="font-serif text-lg text-espresso-900 mb-6 text-center">
          Appointment Details
        </h3>

        <div className="space-y-4">
          {/* Service */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
              <span className="text-gold-700 text-lg">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-espresso-500">Service</p>
              <p className="font-medium text-espresso-800">{service.name}</p>
              <p className="text-sm text-espresso-600">
                {formatDuration(service.durationMinutes)} •{' '}
                {formatPrice(service.priceCents)}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-gold-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-espresso-500">Date & Time</p>
              <p className="font-medium text-espresso-800">
                {format(parseISO(booking.appointmentDatetime), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-espresso-600">
                {format(parseISO(booking.appointmentDatetime), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gold-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-espresso-500">Location</p>
              <p className="font-medium text-espresso-800">
                Lystic Lavish Beauty Bar
              </p>
              <p className="text-sm text-espresso-600">
                123 Beauty Lane, City, ST 12345
              </p>
            </div>
          </div>

          {/* Booking Reference */}
          <div className="pt-4 border-t border-nude-200">
            <p className="text-sm text-espresso-500">Booking Reference</p>
            <p className="font-mono text-sm text-espresso-800 mt-1">
              {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </Card>

      {/* Important Reminders */}
      <Card variant="default" padding="md" className="animate-fade-in-up animation-delay-400">
        <h4 className="font-medium text-espresso-800 mb-3">
          Important Reminders
        </h4>
        <ul className="text-sm text-espresso-600 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-600" />
            Please arrive 5-10 minutes before your appointment
          </li>
          <li className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-600" />
            Check your email for confirmation and calendar invite
          </li>
          <li className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold-600" />
            Need to reschedule? Contact us at least 24 hours in advance
          </li>
        </ul>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-500">
        {payment.receiptUrl && (
          <a
            href={payment.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" fullWidth>
              View Receipt
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        )}
        <Link href="/" className="flex-1">
          <Button variant="primary" fullWidth>
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </div>

      {/* Contact Info */}
      <p className="text-sm text-espresso-500 animate-fade-in animation-delay-500">
        Questions? Call us at{' '}
        <a href="tel:+1234567890" className="text-gold-600 hover:text-gold-700">
          (123) 456-7890
        </a>{' '}
        or email{' '}
        <a
          href="mailto:hello@lysticlavish.com"
          className="text-gold-600 hover:text-gold-700"
        >
          hello@lysticlavish.com
        </a>
      </p>
    </div>
  );
}
