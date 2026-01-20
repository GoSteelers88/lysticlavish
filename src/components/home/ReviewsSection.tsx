'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: 'Sarah M.',
    rating: 5,
    service: 'Lavish Hydrating Glow Facial',
    review:
      'Absolutely incredible experience! My skin has never looked better. The attention to detail and the luxurious atmosphere made me feel so pampered.',
    date: '2 weeks ago',
  },
  {
    id: 2,
    name: 'Michelle T.',
    rating: 5,
    service: 'Brow Lamination & Tint',
    review:
      'Finally found someone who understands brows! The results exceeded my expectations. My brows look fuller and perfectly shaped.',
    date: '1 month ago',
  },
  {
    id: 3,
    name: 'Jessica R.',
    rating: 5,
    service: 'Soft Glam Makeup',
    review:
      'Had my makeup done for my sister\'s wedding and received so many compliments! The look lasted all day and photographed beautifully.',
    date: '3 weeks ago',
  },
  {
    id: 4,
    name: 'Amanda K.',
    rating: 5,
    service: 'Microdermabrasion',
    review:
      'I\'ve been struggling with uneven skin texture for years. After just one session, I could see a noticeable difference. Can\'t wait for my next appointment!',
    date: '1 week ago',
  },
  {
    id: 5,
    name: 'Lauren P.',
    rating: 5,
    service: 'Full Arm & Leg Wax',
    review:
      'Super clean, professional, and virtually painless! The results lasted longer than any waxing I\'ve had before. Highly recommend!',
    date: '2 weeks ago',
  },
  {
    id: 6,
    name: 'Nicole B.',
    rating: 5,
    service: 'Acne Facial',
    review:
      'As someone with sensitive, acne-prone skin, I was nervous. But the treatment was gentle yet effective. My skin is clearing up beautifully.',
    date: '1 month ago',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < rating ? 'text-gold-500 fill-gold-500' : 'text-nude-300'
          )}
        />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section id="reviews" className="section bg-white overflow-hidden">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1.5 bg-gold-100 rounded-full mb-4">
            <Star className="w-4 h-4 text-gold-600 fill-gold-600 mr-2" />
            <span className="text-sm font-medium text-gold-800">Client Love</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-espresso-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-espresso-600">
            Don't just take our word for it. Here's what our amazing clients
            have to say about their Lystic Lavish experience.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card
              key={review.id}
              variant="hover"
              padding="md"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-gold-300 mb-4" />

              {/* Rating */}
              <StarRating rating={review.rating} />

              {/* Review Text */}
              <p className="mt-4 text-espresso-700 leading-relaxed">
                "{review.review}"
              </p>

              {/* Divider */}
              <div className="divider" />

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-espresso-900">{review.name}</p>
                  <p className="text-sm text-espresso-500">{review.service}</p>
                </div>
                <span className="text-xs text-espresso-400">{review.date}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Overall Rating */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-champagne-100 rounded-2xl">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-gold-500 fill-gold-500"
                />
              ))}
            </div>
            <span className="font-serif text-2xl text-espresso-900">5.0</span>
            <span className="text-espresso-600">from 100+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
}
