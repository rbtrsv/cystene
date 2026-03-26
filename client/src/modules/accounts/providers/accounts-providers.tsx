'use client';

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../utils/react-query.client';
// Client auth provider (comment out to switch back):
// import AuthProvider from '../providers/auth-provider-client';

// Server auth provider (current):
import AuthProvider from '../providers/auth-provider-server';
import OrganizationProvider from './organizations-provider';
import OrganizationMembersProvider from './organization-members-provider';
import OrganizationInvitationsProvider from './organization-invitations-provider';
import SubscriptionProvider from './subscriptions-provider';
import OAuthProvider from './oauth-provider';

/**
 * AccountsProviders props
 */
interface AccountsProvidersProps {
  children: ReactNode;
}

/**
 * Complete accounts providers component
 * 
 * Provides all required providers for hooks to work properly
 */
export function AccountsProviders({ children }: AccountsProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <OrganizationMembersProvider>
            <OrganizationInvitationsProvider>
              <SubscriptionProvider>
                <OAuthProvider>
                  {children}
                </OAuthProvider>
              </SubscriptionProvider>
            </OrganizationInvitationsProvider>
          </OrganizationMembersProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Default export
 */
export default AccountsProviders;
