import { Metadata } from 'next';
import PrivacyPolicy from '@/modules/main/components/Legal/PrivacyPolicy';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - Nudgio',
  description: 'Learn how Nudgio collects, uses, and protects your personal information. Our privacy policy explains your rights and our data practices.',
  openGraph: {
    title: 'Privacy Policy - Nudgio',
    description: 'Learn how Nudgio collects, uses, and protects your personal information.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - Nudgio',
    description: 'Learn how Nudgio collects, uses, and protects your personal information.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <NavbarDownwards />
      <div className='grow pt-20 sm:pt-24 md:pt-28'>
        <PrivacyPolicy />
      </div>
      <Footer />
    </div>
  );
}
