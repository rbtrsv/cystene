'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useGeneStore } from '@/modules/nexotype/store/omics/gene.store';
import { type Gene } from '@/modules/nexotype/schemas/omics/gene.schemas';

/**
 * Context type for the genes provider
 */
export interface GeneContextType {
  // State
  genes: Gene[];
  activeGeneId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveGene: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const GeneContext = createContext<GeneContextType | null>(null);

/**
 * Provider component for gene-related state and actions
 */
export function GeneProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    genes,
    activeGeneId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGene,
    clearError,
  } = useGeneStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useGeneStore.persist.rehydrate();
  }, []);

  // Initialize genes on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing genes:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GeneContextType>(() => ({
    genes,
    activeGeneId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGene,
    clearError,
  }), [
    genes,
    activeGeneId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGene,
    clearError,
  ]);

  return (
    <GeneContext.Provider value={contextValue}>
      {children}
    </GeneContext.Provider>
  );
}

/**
 * Default export
 */
export default GeneProvider;
