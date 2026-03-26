'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useMarketOrganizationStore } from '@/modules/nexotype/store/commercial/market-organization.store';
import { type MarketOrganization } from '@/modules/nexotype/schemas/commercial/market-organization.schemas';

/**
 * Context type for the market organizations provider
 */
export interface MarketOrganizationContextType {
  // State
  marketOrganizations: MarketOrganization[];
  activeMarketOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveMarketOrganization: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const MarketOrganizationContext = createContext<MarketOrganizationContextType | null>(null);

/**
 * Provider component for market organization-related state and actions
 */
export function MarketOrganizationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    marketOrganizations,
    activeMarketOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveMarketOrganization,
    clearError,
  } = useMarketOrganizationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useMarketOrganizationStore.persist.rehydrate();
  }, []);

  // Initialize market organizations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing market organizations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<MarketOrganizationContextType>(() => ({
    marketOrganizations,
    activeMarketOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveMarketOrganization,
    clearError,
  }), [
    marketOrganizations,
    activeMarketOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveMarketOrganization,
    clearError,
  ]);

  return (
    <MarketOrganizationContext.Provider value={contextValue}>
      {children}
    </MarketOrganizationContext.Provider>
  );
}

/**
 * Default export
 */
export default MarketOrganizationProvider;
