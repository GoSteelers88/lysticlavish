import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { GallerySection } from '@/components/home/GallerySection';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { PoliciesSection } from '@/components/home/PoliciesSection';
import { ContactSection } from '@/components/home/ContactSection';
import { MobileBookCTA } from '@/components/home/MobileBookCTA';
import { isPromoLive } from '@/config/promotions';

// Re-render at most every 5 minutes so the sale ribbon and sale prices switch
// on/off by themselves at the dates in src/config/promotions.ts.
export const revalidate = 300;

export default function HomePage() {
  const promoLive = isPromoLive();

  return (
    <>
      <Header />

      <main className="flex-1">
        <HeroSection promoLive={promoLive} />
        <ServicesSection promoLive={promoLive} />
        <GallerySection />
        <ReviewsSection />
        <PoliciesSection />
        <ContactSection />
      </main>

      <Footer />

      {/* Mobile Sticky CTA */}
      <MobileBookCTA />
    </>
  );
}
