'use client';

import { ReactNode } from 'react';
import { ConnectionProvider } from './ecommerce-connections-provider';
import { SettingsProvider } from './recommendation-settings-provider';
import { AnalyticsProvider } from './data-provider';

/**
 * EcommerceProviders props
 */
interface EcommerceProvidersProps {
  children: ReactNode;
}

/**
 * Complete ecommerce providers component
 *
 * Provides all required providers for ecommerce hooks to work properly.
 *
 * Note: This should be nested inside AccountsProviders since ecommerce
 * depends on organization context from accounts module.
 */
export function EcommerceProviders({ children }: EcommerceProvidersProps) {
  return (
    <ConnectionProvider initialFetch={true}>
      <SettingsProvider initialFetch={false}>
        <AnalyticsProvider initialFetch={false}>
          {children}
        </AnalyticsProvider>
      </SettingsProvider>
    </ConnectionProvider>
  );
}

/**
 * Default export
 */
export default EcommerceProviders;
