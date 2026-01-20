import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { GallerySection } from '@/components/home/GallerySection';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { PoliciesSection } from '@/components/home/PoliciesSection';
import { ContactSection } from '@/components/home/ContactSection';
import { MobileBookCTA } from '@/components/home/MobileBookCTA';

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
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
