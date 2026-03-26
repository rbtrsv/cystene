import Login from '@/modules/accounts/components/login-signup';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - Nexotype',
  description: 'Create a new Nexotype account',
};

export default function RegisterPage() {
  return <Login mode="signup" />;
}
