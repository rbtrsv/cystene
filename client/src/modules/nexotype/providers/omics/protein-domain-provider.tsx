'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useProteinDomainStore } from '@/modules/nexotype/store/omics/protein-domain.store';
import { type ProteinDomain } from '@/modules/nexotype/schemas/omics/protein-domain.schemas';

/**
 * Context type for the protein domains provider
 */
export interface ProteinDomainContextType {
  // State
  proteinDomains: ProteinDomain[];
  activeProteinDomainId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveProteinDomain: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ProteinDomainContext = createContext<ProteinDomainContextType | null>(null);

/**
 * Provider component for protein domain-related state and actions
 */
export function ProteinDomainProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    proteinDomains,
    activeProteinDomainId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProteinDomain,
    clearError,
  } = useProteinDomainStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useProteinDomainStore.persist.rehydrate();
  }, []);

  // Initialize protein domains on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing protein domains:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ProteinDomainContextType>(() => ({
    proteinDomains,
    activeProteinDomainId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProteinDomain,
    clearError,
  }), [
    proteinDomains,
    activeProteinDomainId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProteinDomain,
    clearError,
  ]);

  return (
    <ProteinDomainContext.Provider value={contextValue}>
      {children}
    </ProteinDomainContext.Provider>
  );
}

/**
 * Default export
 */
export default ProteinDomainProvider;
