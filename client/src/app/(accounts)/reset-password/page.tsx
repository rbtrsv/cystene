import { ResetPasswordForm } from '@/modules/accounts/components/reset-password-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password - Nexotype',
  description: 'Set your new Nexotype account password',
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}