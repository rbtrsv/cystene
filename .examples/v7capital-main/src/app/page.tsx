import { Metadata, Viewport } from 'next';
// import { Metadata, Viewport } from 'next'
import HeroSection from '@/modules/main/components/HeroSection/HeroSection';
import Carousel from '@/modules/main/components/Carousel/Carousel';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import TeamSection from '@/modules/main/components/TeamSection/TeamSection';
import ContactSection from '@/modules/main/components/ContactSection/ContactSection';
import Footer from '@/modules/main/components/Footer/Footer';
import HeaderSection from '@/modules/main/components/HeaderSection/HeaderSection';
import Portfolio from '@/modules/main/components/Portfolio/Portfolio';
import HeroText from '@/modules/main/components/HeroSection/HeroText';
import Navbar from '@/modules/main/components/Navbar/Navbar';
import logo from "@/images/company/logo-v7-black.png";
import Favicon from '@/images/public/favicon.ico';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.v7capital.ro'),
  title: 'Evergreen investment holding empowering local SMEs.',
  description:'Guided by trust, responsibility, and vision, we back entrepreneurs whose long-term perspective builds resilience, sustainability, and meaningful change.',
  icons: { icon: Favicon.src },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Evergreen investment holding empowering local SMEs.',
    description:
      'Guided by trust, responsibility, and vision, we back entrepreneurs whose long-term perspective builds resilience, sustainability, and meaningful change.',
    images: [{ url: logo.src }],
    url: '/',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function Home() {
  return (
    <>
      <main className='bg-white text-black dark:bg-zinc-900 dark:text-white'>
        {/* <Navbar /> */}
        <NavbarDownwards />
        {/* <HeroSection /> */}
        <HeroText />
        <Carousel />
        <HeaderSection />
        <Portfolio />
        <TeamSection />
        <ContactSection />
        <Footer />
        {/* <div className="bg-indigo-600 w-full h-screen"></div> */}
        {/* <div className="bg-indigo-600! bg-white dark:bg-black w-full h-screen! h-[300px]"></div> */}
      </main>
    </>
  );
}
