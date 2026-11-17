'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/lysticlavishbeautybar/';

// Real client results from @lysticlavishbeautybar (images in public/gallery/,
// saved from her own posts on 2026-11-16). Each tile opens its post.
const galleryItems = [
  {
    id: 'mens-custom-facial',
    title: "Men's Custom Facial",
    category: 'Facials',
    image: '/gallery/mens-custom-facial.jpg',
    alt: 'Esthetician performing a custom facial on a male client',
    href: 'https://www.instagram.com/lysticlavishbeautybar/reel/DfyQY0ziNke/',
  },
  {
    id: 'brow-wax',
    title: 'Brow Waxing',
    category: 'Waxing',
    image: '/gallery/brow-wax.jpg',
    alt: 'Client with freshly shaped brows after a brow wax',
    href: 'https://www.instagram.com/lysticlavishbeautybar/p/DdPk_aeiF0d/',
  },
  {
    id: 'underarm-wax',
    title: 'Underarm Wax — Before & After',
    category: 'Waxing',
    image: '/gallery/underarm-wax-before-after.jpg',
    alt: 'Before and after photos of an underarm wax',
    href: 'https://www.instagram.com/lysticlavishbeautybar/p/DXSiPyNAvpz/',
  },
  {
    id: 'desert-clay-mask',
    title: 'Desert Clay Mask Facial',
    category: 'Facials',
    image: '/gallery/desert-clay-mask-facial.jpg',
    alt: 'Client relaxing with a desert clay mask and eye pads during a facial',
    href: 'https://www.instagram.com/lysticlavishbeautybar/p/DYOH-XFFgAY/',
  },
  {
    id: 'mens-ingrown-care',
    title: "Men's Facial — Ingrown Care",
    category: 'Facials',
    image: '/gallery/mens-facial-ingrown-care.jpg',
    alt: "Close-up of a male client's beard line during a facial for ingrown hairs",
    href: 'https://www.instagram.com/lysticlavishbeautybar/p/DXSlyuNAjYV/',
  },
  {
    id: 'post-facial-glow',
    title: 'Post-Facial Glow',
    category: 'Facials',
    image: '/gallery/post-facial-glow.jpg',
    alt: 'Client with glowing skin after her facial',
    href: 'https://www.instagram.com/lysticlavishbeautybar/p/DYOH-XFFgAY/',
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

        {/* Gallery Grid — even 3x2 (desktop) / 2x3 (phone) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.title} — view on Instagram`}
              className="group relative block aspect-square rounded-2xl overflow-hidden bg-nude-100 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

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
            </a>
          ))}
        </div>

        {/* Instagram CTA */}
        <div className="text-center mt-10">
          <p className="text-espresso-600 mb-4">
            Follow us on Instagram for more transformations
          </p>
          <a
            href={INSTAGRAM_URL}
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
            @lysticlavishbeautybar
          </a>
        </div>
      </div>
    </section>
  );
}
