import Login from '@/modules/accounts/components/login-signup';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Nexotype',
  description: 'Sign in to your Nexotype account',
};

export default function LoginPage() {
  return <Login mode="signin" />;
}
