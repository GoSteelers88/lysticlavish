import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Lystic Lavish Beauty Bar | Luxury Skincare & Beauty Services',
  description:
    'Experience premium facials, waxing, eye enhancement, and makeup services at Lystic Lavish Beauty Bar. Book your lavish treatment today.',
  keywords: [
    'beauty bar',
    'luxury facials',
    'skincare',
    'waxing',
    'makeup',
    'brow lamination',
    'microdermabrasion',
    'microneedling',
  ],
  openGraph: {
    title: 'Lystic Lavish Beauty Bar',
    description: 'Luxury skincare and beauty services for the modern woman.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
