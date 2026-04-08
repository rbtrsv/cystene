import { Metadata, Viewport } from 'next';
import Features from '@/modules/main/components/Features/Features';
import Workflow from '@/modules/main/components/Workflow/Workflow';
import Pricing from '@/modules/main/components/Pricing/Pricing';
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cystene',
  url: 'https://www.cystene.com',
  description:
    'Cybersecurity scanning platform for infrastructure security. Port scanning, DNS enumeration, SSL/TLS analysis, and web security assessments with prioritized findings and remediation guidance.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free tier available',
  },
  creator: {
    '@type': 'Organization',
    name: 'Buraro Technologies',
    url: 'https://www.cystene.com',
  },
  featureList: [
    'Port Scanning',
    'DNS Enumeration',
    'SSL/TLS Analysis',
    'Web Security Checks',
    'Scheduled Scans',
    'Exportable Reports',
    'Analytics Dashboard',
  ],
};

export default function Home() {
  return (
    <>
      {/* JSON-LD structured data for Google and AI crawlers */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <NavbarDownwards />
        <HeroSectionAnimated />
        <Features />
        <Workflow />
        <Pricing />
        <ContactSection />
        <Footer />
        {/* <div className="bg-violet-600 w-full h-[300px]"></div> */}
      </main>
    </>
  );
}
