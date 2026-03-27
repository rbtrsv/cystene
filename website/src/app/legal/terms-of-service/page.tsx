import { Metadata } from 'next';
import TermsOfService from '@/modules/main/components/Legal/TermsOfService';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service - Cystene',
  description: 'Read the terms and conditions for using the Cystene cybersecurity scanning platform.',
  openGraph: {
    title: 'Terms of Service - Cystene',
    description: 'Read the terms and conditions for using the Cystene cybersecurity scanning platform.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service - Cystene',
    description: 'Read the terms and conditions for using the Cystene cybersecurity scanning platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <NavbarDownwards />
      <div className='grow pt-20 sm:pt-24 md:pt-28'>
        <TermsOfService />
      </div>
      <Footer />
    </div>
  );
}
