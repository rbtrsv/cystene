import { Metadata, Viewport } from 'next';
import Technologies from '@/modules/main/components/Technologies/Technologies';
import ContactSection from '@/modules/main/components/ContactSection/ContactSection';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import FinpyDefault from '@/modules/main/images/logos/finpy_default.png';
import HeroSectionAnimated from '@/modules/main/components/HeroSectionAnimated/HeroSectionAnimated';
import Favicon from '@/modules/main/public/favicon.ico';

const BASE_URL = 'https://www.finpy.tech';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Unparalleled. Software. Solutions',
  description:
    'Transform your business landscape with our game-changing, data-driven technology solutions.',
  creator: 'Finpy Team',
  publisher: 'Finpy Tech',
  category: 'Software Solutions, Data-Driven Technology, Business Transformation, Fintech',
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
    title: 'Unparalleled. Software. Solutions',
    description:
      'Transform your business landscape with our game-changing, data-driven technology solutions.',
    url: '/',
    siteName: 'Finpy Tech',
    images: [
      {
        url: FinpyDefault.src,
        width: FinpyDefault.width,
        height: FinpyDefault.height,
        alt: 'Finpy Tech',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unparalleled. Software. Solutions',
    description:
      'Transform your business landscape with our game-changing, data-driven technology solutions.',
    creator: '@finpy_tech',
    site: '@finpy_tech',
    images: [FinpyDefault.src],
  },
  keywords: [
    'Software Solutions',
    'Data-Driven Technology',
    'Business Transformation',
    'Fintech',
  ],
  authors: [{ name: 'Finpy Team' }],
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
        <Technologies />
        <ContactSection />
        <Footer />
        {/* <div className="bg-violet-600 w-full h-[300px]"></div> */}
      </main>
    </>
  );
}
