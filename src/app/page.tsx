import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { GallerySection } from '@/components/home/GallerySection';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { PoliciesSection } from '@/components/home/PoliciesSection';
import { ContactSection } from '@/components/home/ContactSection';
import { MobileBookCTA } from '@/components/home/MobileBookCTA';
import { promoPhase } from '@/config/promotions';

// Re-render at most every 5 minutes so the sale ribbon (teaser -> live -> off)
// and sale prices switch by themselves at the dates in src/config/promotions.ts.
export const revalidate = 300;

export default function HomePage() {
  const phase = promoPhase();
  const promoLive = phase === 'live';

  return (
    <>
      <Header />

      <main className="flex-1">
        <HeroSection promoPhase={phase} />
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
