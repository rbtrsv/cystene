'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePhenotypeStore } from '@/modules/nexotype/store/clinical/phenotype.store';
import { type Phenotype } from '@/modules/nexotype/schemas/clinical/phenotype.schemas';

/**
 * Context type for the phenotypes provider
 */
export interface PhenotypeContextType {
  // State
  phenotypes: Phenotype[];
  activePhenotypeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePhenotype: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PhenotypeContext = createContext<PhenotypeContextType | null>(null);

/**
 * Provider component for phenotype-related state and actions
 */
export function PhenotypeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    phenotypes,
    activePhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePhenotype,
    clearError,
  } = usePhenotypeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePhenotypeStore.persist.rehydrate();
  }, []);

  // Initialize phenotypes on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing phenotypes:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PhenotypeContextType>(() => ({
    phenotypes,
    activePhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePhenotype,
    clearError,
  }), [
    phenotypes,
    activePhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePhenotype,
    clearError,
  ]);

  return (
    <PhenotypeContext.Provider value={contextValue}>
      {children}
    </PhenotypeContext.Provider>
  );
}

/**
 * Default export
 */
export default PhenotypeProvider;
