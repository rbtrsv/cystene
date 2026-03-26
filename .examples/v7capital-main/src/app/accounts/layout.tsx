import { ReactNode } from 'react';
import AuthProvider from '@/modules/accounts/providers/auth-provider';

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </AuthProvider>
  );
}
