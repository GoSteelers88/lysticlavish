'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import { Shield, AlertCircle } from 'lucide-react';

const policies = [
  {
    id: 'booking',
    title: 'Booking & Appointments',
    content: `
      <ul class="space-y-2">
        <li>• Appointments can be booked online 24/7 or by phone during business hours.</li>
        <li>• A valid payment method is required to secure your booking.</li>
        <li>• Please arrive 5-10 minutes before your scheduled appointment.</li>
        <li>• First-time clients may need to complete a brief consultation form.</li>
        <li>• We recommend booking in advance, especially for weekends and holidays.</li>
      </ul>
    `,
  },
  {
    id: 'cancellation',
    title: 'Cancellation & Rescheduling',
    content: `
      <ul class="space-y-2">
        <li>• <strong>24-hour notice</strong> is required for cancellations or rescheduling.</li>
        <li>• Cancellations made within 24 hours may be subject to a 50% cancellation fee.</li>
        <li>• No-shows will be charged the full service amount.</li>
        <li>• We understand emergencies happen - please contact us as soon as possible.</li>
        <li>• Rescheduling is free when done with 24+ hours notice.</li>
      </ul>
    `,
  },
  {
    id: 'late-arrival',
    title: 'Late Arrival Policy',
    content: `
      <ul class="space-y-2">
        <li>• If you arrive late, we will do our best to accommodate your full service.</li>
        <li>• However, your appointment may need to be shortened to avoid delays for other clients.</li>
        <li>• Arrivals more than 15 minutes late may need to be rescheduled.</li>
        <li>• Full service pricing applies regardless of shortened treatment time due to late arrival.</li>
      </ul>
    `,
  },
  {
    id: 'payment',
    title: 'Payment & Deposits',
    content: `
      <ul class="space-y-2">
        <li>• We accept all major credit cards, debit cards, and digital payments.</li>
        <li>• Full payment is due at the time of booking or at the end of your appointment.</li>
        <li>• Some services may require a deposit to secure your booking.</li>
        <li>• Deposits are non-refundable but may be applied to rescheduled appointments.</li>
        <li>• Gift cards are available for purchase and make perfect gifts!</li>
      </ul>
    `,
  },
  {
    id: 'health-safety',
    title: 'Health & Safety',
    content: `
      <ul class="space-y-2">
        <li>• Please inform us of any allergies, skin conditions, or medical concerns.</li>
        <li>• All tools and equipment are sanitized between clients.</li>
        <li>• We use high-quality, professional-grade products.</li>
        <li>• If you are feeling unwell, please reschedule your appointment.</li>
        <li>• Patch tests are available upon request for sensitive clients.</li>
      </ul>
    `,
  },
  {
    id: 'preparation',
    title: 'Service Preparation Tips',
    content: `
      <ul class="space-y-2">
        <li>• <strong>Facials:</strong> Avoid retinols and exfoliants 48 hours before treatment.</li>
        <li>• <strong>Waxing:</strong> Hair should be at least 1/4 inch long for best results.</li>
        <li>• <strong>Brow Services:</strong> Come with clean, makeup-free brows.</li>
        <li>• <strong>Makeup:</strong> Arrive with clean, moisturized skin.</li>
        <li>• <strong>Microneedling:</strong> No sun exposure or active breakouts before treatment.</li>
      </ul>
    `,
  },
];

export function PoliciesSection() {
  return (
    <section id="policies" className="section bg-champagne-50">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-white rounded-full mb-4 shadow-soft">
            <Shield className="w-4 h-4 text-gold-600 mr-2" />
            <span className="text-sm font-medium text-espresso-700">Good to Know</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso-900 mb-4">
            Our Policies
          </h2>
          <p className="text-espresso-600">
            We want your experience to be seamless. Please review our policies
            to ensure a smooth and enjoyable visit.
          </p>
        </div>

        {/* Policies Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" defaultValue="booking">
            {policies.map((policy) => (
              <AccordionItem key={policy.id} value={policy.id}>
                <AccordionTrigger>{policy.title}</AccordionTrigger>
                <AccordionContent>
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: policy.content }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Important Note */}
          <div className="mt-8 p-4 bg-gold-50 border border-gold-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-espresso-700">
              <strong>Questions?</strong> Don't hesitate to reach out! We're happy to
              clarify any policies or accommodate special requests when possible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
