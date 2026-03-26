'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useVariantPhenotypeStore } from '@/modules/nexotype/store/knowledge_graph/variant-phenotype.store';
import { type VariantPhenotype } from '@/modules/nexotype/schemas/knowledge_graph/variant-phenotype.schemas';

/**
 * Context type for the variant phenotypes provider
 */
export interface VariantPhenotypeContextType {
  // State
  variantPhenotypes: VariantPhenotype[];
  activeVariantPhenotypeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveVariantPhenotype: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const VariantPhenotypeContext = createContext<VariantPhenotypeContextType | null>(null);

/**
 * Provider component for variant phenotype-related state and actions
 */
export function VariantPhenotypeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    variantPhenotypes,
    activeVariantPhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariantPhenotype,
    clearError,
  } = useVariantPhenotypeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useVariantPhenotypeStore.persist.rehydrate();
  }, []);

  // Initialize variant phenotypes on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing variant phenotypes:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<VariantPhenotypeContextType>(() => ({
    variantPhenotypes,
    activeVariantPhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariantPhenotype,
    clearError,
  }), [
    variantPhenotypes,
    activeVariantPhenotypeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveVariantPhenotype,
    clearError,
  ]);

  return (
    <VariantPhenotypeContext.Provider value={contextValue}>
      {children}
    </VariantPhenotypeContext.Provider>
  );
}

/**
 * Default export
 */
export default VariantPhenotypeProvider;
