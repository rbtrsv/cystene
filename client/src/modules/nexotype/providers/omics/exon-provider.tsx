'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useExonStore } from '@/modules/nexotype/store/omics/exon.store';
import { type Exon } from '@/modules/nexotype/schemas/omics/exon.schemas';

/**
 * Context type for the exons provider
 */
export interface ExonContextType {
  // State
  exons: Exon[];
  activeExonId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveExon: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ExonContext = createContext<ExonContextType | null>(null);

/**
 * Provider component for exon-related state and actions
 */
export function ExonProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    exons,
    activeExonId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExon,
    clearError,
  } = useExonStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useExonStore.persist.rehydrate();
  }, []);

  // Initialize exons on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing exons:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ExonContextType>(() => ({
    exons,
    activeExonId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExon,
    clearError,
  }), [
    exons,
    activeExonId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExon,
    clearError,
  ]);

  return (
    <ExonContext.Provider value={contextValue}>
      {children}
    </ExonContext.Provider>
  );
}

/**
 * Default export
 */
export default ExonProvider;
