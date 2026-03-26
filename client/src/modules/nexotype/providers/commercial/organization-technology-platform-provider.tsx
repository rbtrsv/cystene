'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOrganizationTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/organization-technology-platform.store';
import { type OrganizationTechnologyPlatform } from '@/modules/nexotype/schemas/commercial/organization-technology-platform.schemas';

/**
 * Context type for the organization technology platforms provider
 */
export interface OrganizationTechnologyPlatformContextType {
  // State
  organizationTechnologyPlatforms: OrganizationTechnologyPlatform[];
  activeOrganizationTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveOrganizationTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const OrganizationTechnologyPlatformContext = createContext<OrganizationTechnologyPlatformContextType | null>(null);

/**
 * Provider component for organization technology platform-related state and actions
 */
export function OrganizationTechnologyPlatformProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    organizationTechnologyPlatforms,
    activeOrganizationTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganizationTechnologyPlatform,
    clearError,
  } = useOrganizationTechnologyPlatformStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useOrganizationTechnologyPlatformStore.persist.rehydrate();
  }, []);

  // Initialize organization technology platforms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing organization technology platforms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OrganizationTechnologyPlatformContextType>(() => ({
    organizationTechnologyPlatforms,
    activeOrganizationTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganizationTechnologyPlatform,
    clearError,
  }), [
    organizationTechnologyPlatforms,
    activeOrganizationTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganizationTechnologyPlatform,
    clearError,
  ]);

  return (
    <OrganizationTechnologyPlatformContext.Provider value={contextValue}>
      {children}
    </OrganizationTechnologyPlatformContext.Provider>
  );
}

/**
 * Default export
 */
export default OrganizationTechnologyPlatformProvider;
