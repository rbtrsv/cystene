// Client auth provider (comment out to switch back):
// import AuthProvider from '@/modules/accounts/providers/auth-provider-client';

// Server auth provider (current):
import AuthProvider from '@/modules/accounts/providers/auth-provider-server';
import OAuthProvider from '@/modules/accounts/providers/oauth-provider';

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OAuthProvider>
        <div className="min-h-screen bg-white dark:bg-black">
          {children}
        </div>
      </OAuthProvider>
    </AuthProvider>
  );
}
