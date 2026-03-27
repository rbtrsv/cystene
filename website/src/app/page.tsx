import { Metadata, Viewport } from 'next';
import Features from '@/modules/main/components/Features/Features';
import HowItWorks from '@/modules/main/components/HowItWorks/HowItWorks';
import ContactSection from '@/modules/main/components/ContactSection/ContactSection';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import HeroSectionAnimated from '@/modules/main/components/HeroSectionAnimated/HeroSectionAnimated';
import Favicon from '@/modules/main/public/favicon.ico';

const BASE_URL = 'https://www.cystene.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Cystene — Cybersecurity Scanning Platform',
  description:
    'Comprehensive cybersecurity scanning for your infrastructure. Port scanning, DNS enumeration, SSL analysis, and web security assessments.',
  creator: 'Cystene Team',
  publisher: 'Cystene',
  category: 'Cybersecurity, Vulnerability Scanning, Security Assessment, SaaS',
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
    title: 'Cystene — Cybersecurity Scanning Platform',
    description:
      'Comprehensive cybersecurity scanning for your infrastructure. Port scanning, DNS enumeration, SSL analysis, and web security assessments.',
    url: '/',
    siteName: 'Cystene',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cystene — Cybersecurity Scanning Platform',
    description:
      'Comprehensive cybersecurity scanning for your infrastructure. Port scanning, DNS enumeration, SSL analysis, and web security assessments.',
  },
  keywords: [
    'Cybersecurity',
    'Vulnerability Scanning',
    'Port Scanning',
    'SSL Analysis',
    'DNS Enumeration',
    'Security Assessment',
    'Web Security',
    'Infrastructure Scanning',
    'SaaS',
  ],
  authors: [{ name: 'Cystene Team' }],
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
