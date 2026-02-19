'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ServiceCard } from './ServiceCard';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

// Service categories and items
const serviceCategories = [
  {
    id: 'facials',
    name: 'Facials',
    description: 'Rejuvenating treatments for radiant skin',
    services: [
      {
        id: 'mini-facial',
        name: 'Mini Facial',
        description: 'A quick refresh for your skin. Perfect for busy schedules or first-time facial experiences.',
        durationMinutes: 30,
        priceCents: 6500,
        image: '/services/mini_facial.png',
      },
      {
        id: 'basic-facial-women',
        name: 'Basic & Back Facials (Women)',
        description: 'Complete facial treatment including back care. Deep cleansing, exfoliation, and hydration.',
        durationMinutes: 60,
        priceCents: 9500,
        featured: true,
        image: '/services/back_facial.png',
      },
      {
        id: 'basic-facial-men',
        name: 'Basic Back Facials (Men)',
        description: 'Tailored facial treatment for men. Addressing specific skincare needs with professional care.',
        durationMinutes: 60,
        priceCents: 10500,
        image: '/services/back_facial.png',
      },
      {
        id: 'acne-facial',
        name: 'Acne Facial (Grade 1 & 2)',
        description: 'Targeted treatment for acne-prone skin. Helps clear breakouts and prevent future blemishes.',
        durationMinutes: 75,
        priceCents: 15500,
        image: '/services/acne_facial.png',
      },
      {
        id: 'lavish-glow',
        name: 'Full Lavish Hydrating Glow Facial',
        description: 'Our signature treatment for women and non-bearded men. Ultimate hydration and luminous glow.',
        durationMinutes: 90,
        priceCents: 19500,
        featured: true,
        image: '/services/lavish_glow_facial.png',
      },
      {
        id: 'dapper-facial',
        name: 'Men\'s Custom Bearded "Dapper than Ever" Facial',
        description: 'Specialized facial for bearded gentlemen. Skin and beard care combined for the perfect look.',
        durationMinutes: 75,
        priceCents: 15500,
        image: '/services/mens_beard_facial.png',
      },
      {
        id: 'microdermabrasion',
        name: 'Microdermabrasion Facial',
        description: 'Advanced exfoliation treatment for smoother, brighter skin. Reduces fine lines and improves texture.',
        durationMinutes: 60,
        priceCents: 15000,
        image: '/services/lavish_glow_facial.png',
      },
      {
        id: 'microneedling',
        name: 'Microneedling',
        description: 'Collagen-boosting treatment for skin rejuvenation. Minimizes scars, wrinkles, and large pores.',
        durationMinutes: 60,
        priceCents: 17500,
        image: '/services/microneedling.png',
      },
    ],
  },
  {
    id: 'waxing',
    name: 'Waxing',
    description: 'Smooth, long-lasting hair removal',
    services: [
      {
        id: 'underarm-wax',
        name: 'Underarm Waxing',
        description: 'Quick and efficient underarm hair removal for smooth, confident arms.',
        durationMinutes: 30,
        priceCents: 2000,
        image: '/services/waxing.png',
      },
      {
        id: 'chin-wax',
        name: 'Chin Waxing',
        description: 'Precise hair removal for a smooth, defined chin area.',
        durationMinutes: 30,
        priceCents: 1500,
        image: '/services/waxing.png',
      },
      {
        id: 'brow-wax',
        name: 'Brow Waxing',
        description: 'Expert shaping for perfectly defined eyebrows.',
        durationMinutes: 20,
        priceCents: 1200,
        image: '/services/waxing.png',
      },
      {
        id: 'brow-lam-wax',
        name: 'Brow Lamination & Waxing',
        description: 'Lamination for fuller brows combined with expert waxing for perfect shape.',
        durationMinutes: 50,
        priceCents: 7700,
        featured: true,
        image: '/services/lash_and_brow_tint.png',
      },
      {
        id: 'full-arm-wax',
        name: 'Full Arm Wax',
        description: 'Complete arm hair removal from shoulder to wrist.',
        durationMinutes: 100,
        priceCents: 2500,
        image: '/services/waxing.png',
      },
      {
        id: 'leg-wax',
        name: 'Leg Waxing',
        description: 'Smooth, silky legs with long-lasting results.',
        durationMinutes: 50,
        priceCents: 7500,
        image: '/services/waxing.png',
      },
      {
        id: 'brow-wax-tint',
        name: 'Brow Wax w/Tint',
        description: 'Shape and enhance your brows with expert waxing and professional tinting.',
        durationMinutes: 25,
        priceCents: 3700,
        image: '/services/lash_and_brow_tint.png',
      },
      {
        id: 'brow-full-combo',
        name: 'Brow Lamination / Tint / Wax',
        description: 'The complete brow transformation. Lamination, tinting, and precise waxing.',
        durationMinutes: 60,
        priceCents: 10200,
        featured: true,
        image: '/services/lash_and_brow_tint.png',
      },
    ],
  },
  {
    id: 'eye-enhancement',
    name: 'Eye Enhancement',
    description: 'Define and enhance your natural beauty',
    services: [
      {
        id: 'brow-lam',
        name: 'Brow Lamination',
        description: 'Transform unruly brows into sleek, defined arches that last for weeks.',
        durationMinutes: 30,
        priceCents: 6500,
        featured: true,
        image: '/services/lash_and_brow_tint.png',
      },
      {
        id: 'brow-tint',
        name: 'Brow Tint ONLY',
        description: 'Enhance your brows with professional tinting for added definition and depth.',
        durationMinutes: 20,
        priceCents: 2500,
        image: '/services/lash_and_brow_tint.png',
      },
      {
        id: 'brow-lam-tint',
        name: 'Brow Lamination & Tint',
        description: 'Combine lamination with tinting for the ultimate brow enhancement.',
        durationMinutes: 40,
        priceCents: 9000,
        image: '/services/lash_and_brow_tint.png',
      },
    ],
  },
  {
    id: 'makeup',
    name: 'Makeup',
    description: 'Flawless looks for every occasion',
    comingSoon: true,
    services: [
      {
        id: 'natural-glam',
        name: 'Natural Glam',
        description: 'Enhance your natural beauty with a subtle, polished makeup look.',
        durationMinutes: 60,
        priceCents: 10000,
        image: '/services/makeup_application.png',
      },
      {
        id: 'soft-glam',
        name: 'Soft Glam',
        description: 'A beautiful balance of natural and glamorous for any occasion.',
        durationMinutes: 60,
        priceCents: 11500,
        featured: true,
        image: '/services/makeup_application.png',
      },
      {
        id: 'full-glam',
        name: 'Full Glam',
        description: 'Complete transformation with full glamour makeup for special events.',
        durationMinutes: 60,
        priceCents: 13000,
        image: '/services/makeup_application.png',
      },
    ],
  },
];

export function ServicesSection() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('facials');

  const currentCategory = serviceCategories.find((c) => c.id === activeCategory);

  const handleServiceSelect = (serviceId: string) => {
    router.push(`/booking?service=${serviceId}`);
  };

  return (
    <section id="services" className="section bg-white">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-gold-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-gold-600 mr-2" />
            <span className="text-sm font-medium text-gold-800">Our Services</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso-900 mb-4">
            Indulge in Luxury Treatments
          </h2>
          <p className="text-espresso-600">
            From rejuvenating facials to flawless makeup, discover our full range
            of premium beauty services designed to make you look and feel your best.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {serviceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium',
                'transition-all duration-300 inline-flex items-center gap-2',
                activeCategory === category.id
                  ? 'bg-espresso-800 text-champagne-100 shadow-soft'
                  : 'bg-nude-100 text-espresso-700 hover:bg-nude-200'
              )}
            >
              {category.name}
              {category.comingSoon && (
                <span className="text-2xs px-1.5 py-0.5 rounded-full bg-gold-200 text-gold-800 font-medium leading-none">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category Description */}
        {currentCategory && (
          <p className="text-center text-espresso-500 mb-8 animate-fade-in">
            {currentCategory.description}
          </p>
        )}

        {/* Services Grid */}
        {currentCategory?.comingSoon ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-gold-500" />
            </div>
            <h3 className="font-serif text-2xl text-espresso-900 mb-2">Coming Soon</h3>
            <p className="text-espresso-500 text-center max-w-sm">
              Our makeup services are launching soon. Stay tuned for Natural Glam, Soft Glam, and Full Glam appointments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentCategory?.services.map((service, index) => (
              <div
                key={service.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ServiceCard
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  durationMinutes={service.durationMinutes}
                  priceCents={service.priceCents}
                  featured={service.featured}
                  image={service.image}
                  onSelect={handleServiceSelect}
                />
              </div>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/booking')}
          >
            View All Services & Book
          </Button>
        </div>
      </div>
    </section>
  );
}
