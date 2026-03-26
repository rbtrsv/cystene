'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOrganizationStore } from '../store/organizations.store';
import { type Organization } from '../schemas/organizations.schema';

/**
 * Context type for the organizations provider
 */
export interface OrganizationContextType {
  // State
  organizations: Organization[];
  activeOrganization: Organization | undefined;
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  clearError: () => void;
}

// Create the context
export const OrganizationContext = createContext<OrganizationContextType | null>(null);

/**
 * Provider component for organization-related state and actions
 */
export function OrganizationProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    organizations,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useOrganizationStore();
  
  // Get active organization based on activeOrganizationId
  const activeOrganization = useMemo(
    () => organizations.find(org => org.id === activeOrganizationId),
    [organizations, activeOrganizationId]
  );
  
  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useOrganizationStore.persist.rehydrate();
  }, []);

  // Initialize organizations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing organizations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OrganizationContextType>(() => ({
    organizations,
    activeOrganization,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [
    organizations,
    activeOrganization,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  ]);
  
  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Default export
 */
export default OrganizationProvider;
