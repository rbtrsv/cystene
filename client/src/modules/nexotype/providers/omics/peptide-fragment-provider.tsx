'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePeptideFragmentStore } from '@/modules/nexotype/store/omics/peptide-fragment.store';
import { type PeptideFragment } from '@/modules/nexotype/schemas/omics/peptide-fragment.schemas';

/**
 * Context type for the peptide fragments provider
 */
export interface PeptideFragmentContextType {
  // State
  peptideFragments: PeptideFragment[];
  activePeptideFragmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePeptideFragment: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PeptideFragmentContext = createContext<PeptideFragmentContextType | null>(null);

/**
 * Provider component for peptide fragment-related state and actions
 */
export function PeptideFragmentProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    peptideFragments,
    activePeptideFragmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePeptideFragment,
    clearError,
  } = usePeptideFragmentStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePeptideFragmentStore.persist.rehydrate();
  }, []);

  // Initialize peptide fragments on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing peptide fragments:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PeptideFragmentContextType>(() => ({
    peptideFragments,
    activePeptideFragmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePeptideFragment,
    clearError,
  }), [
    peptideFragments,
    activePeptideFragmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePeptideFragment,
    clearError,
  ]);

  return (
    <PeptideFragmentContext.Provider value={contextValue}>
      {children}
    </PeptideFragmentContext.Provider>
  );
}

/**
 * Default export
 */
export default PeptideFragmentProvider;
