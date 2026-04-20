'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const galleryItems = [
  {
    id: 1,
    title: 'Men\'s Facial and Back Facial',
    category: 'Facials',
    image: '/services/mens_back_facial.png',
  },
  {
    id: 2,
    title: 'Lavish Glow Facial',
    category: 'Facials',
    image: '/services/lavish_glow_facial.png',
  },
  {
    id: 3,
    title: 'Makeup Application',
    category: 'Makeup',
    image: '/services/makeup_application.png',
  },
  {
    id: 4,
    title: 'Acne Facial',
    category: 'Facials',
    image: '/services/acne_facial.png',
  },
  {
    id: 5,
    title: 'Leg Waxing',
    category: 'Waxing',
    image: '/services/leg_wax.png',
  },
  {
    id: 6,
    title: 'Brow Lamination',
    category: 'Eye Enhancement',
    image: '/services/lash_and_brow_tint.png',
  },
];

export function GallerySection() {
  return (
    <section id="gallery" className="section bg-champagne-50">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-white rounded-full mb-4 shadow-soft">
            <Camera className="w-4 h-4 text-gold-600 mr-2" />
            <span className="text-sm font-medium text-espresso-700">Our Work</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso-900 mb-4">
            Results That Speak for Themselves
          </h2>
          <p className="text-espresso-600">
            Browse through our gallery of transformations and see the artistry
            behind every treatment at Lystic Lavish.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'group relative aspect-square rounded-2xl overflow-hidden',
                'animate-fade-in-up cursor-pointer',
                // Make first item span 2 rows on larger screens
                index === 0 && 'md:row-span-2 md:aspect-auto'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/10" />

              {/* Hover overlay */}
              <div
                className={cn(
                  'absolute inset-0 bg-espresso-900/0 group-hover:bg-espresso-900/60',
                  'flex items-end p-4 md:p-6',
                  'transition-all duration-300'
                )}
              >
                <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="badge-gold mb-2">{item.category}</span>
                  <h3 className="font-serif text-lg text-white">{item.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram CTA */}
        <div className="text-center mt-10">
          <p className="text-espresso-600 mb-4">
            Follow us on Instagram for more transformations
          </p>
          <a
            href="https://www.instagram.com/Lysticlavish"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center px-6 py-3',
              'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
              'text-white font-medium rounded-full',
              'hover:shadow-lg hover:scale-105',
              'transition-all duration-300'
            )}
          >
            @Lysticlavish
          </a>
        </div>
      </div>
    </section>
  );
}

