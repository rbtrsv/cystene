import { Metadata, Viewport } from 'next';
import Features from '@/modules/main/components/Features/Features';
import HowItWorks from '@/modules/main/components/HowItWorks/HowItWorks';
import ContactSection from '@/modules/main/components/ContactSection/ContactSection';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import HeroSectionAnimated from '@/modules/main/components/HeroSectionAnimated/HeroSectionAnimated';
import Favicon from '@/modules/main/public/favicon.ico';

const BASE_URL = 'https://www.nudgio.tech';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Nudgio — AI-Powered Product Recommendations for E-Commerce',
  description:
    'Boost your e-commerce revenue with intelligent, cross-platform product recommendations. Works with Shopify, WooCommerce, and Magento.',
  creator: 'Nudgio Team',
  publisher: 'Nudgio',
  category: 'E-Commerce, Product Recommendations, AI, SaaS',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: Favicon.src,
    shortcut: Favicon.src,
    apple: Favicon.src,
  },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Nudgio — AI-Powered Product Recommendations for E-Commerce',
    description:
      'Boost your e-commerce revenue with intelligent, cross-platform product recommendations. Works with Shopify, WooCommerce, and Magento.',
    url: '/',
    siteName: 'Nudgio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nudgio — AI-Powered Product Recommendations for E-Commerce',
    description:
      'Boost your e-commerce revenue with intelligent, cross-platform product recommendations. Works with Shopify, WooCommerce, and Magento.',
  },
  keywords: [
    'Product Recommendations',
    'E-Commerce',
    'AI Recommendations',
    'Shopify',
    'WooCommerce',
    'Magento',
    'Cross-Selling',
    'Upselling',
    'SaaS',
  ],
  authors: [{ name: 'Nudgio Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function Home() {
  return (
    <>
      <main>
        <NavbarDownwards />
        <HeroSectionAnimated />
        <Features />
        <HowItWorks />
        <ContactSection />
        <Footer />
        {/* <div className="bg-violet-600 w-full h-[300px]"></div> */}
      </main>
    </>
  );
}
