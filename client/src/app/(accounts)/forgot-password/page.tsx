import { ForgotPasswordForm } from '@/modules/accounts/components/forgot-password-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - Nexotype',
  description: 'Reset your Nexotype account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ForgotPasswordForm />
    </div>
  );
}