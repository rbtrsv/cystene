'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTherapeuticPeptideStore } from '@/modules/nexotype/store/asset/therapeutic-peptide.store';
import { type TherapeuticPeptide } from '@/modules/nexotype/schemas/asset/therapeutic-peptide.schemas';

/**
 * Context type for the therapeutic peptides provider
 */
export interface TherapeuticPeptideContextType {
  // State
  therapeuticPeptides: TherapeuticPeptide[];
  activeTherapeuticPeptideId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTherapeuticPeptide: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TherapeuticPeptideContext = createContext<TherapeuticPeptideContextType | null>(null);

/**
 * Provider component for therapeutic peptide-related state and actions
 */
export function TherapeuticPeptideProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    therapeuticPeptides,
    activeTherapeuticPeptideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticPeptide,
    clearError,
  } = useTherapeuticPeptideStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTherapeuticPeptideStore.persist.rehydrate();
  }, []);

  // Initialize therapeutic peptides on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing therapeutic peptides:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TherapeuticPeptideContextType>(() => ({
    therapeuticPeptides,
    activeTherapeuticPeptideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticPeptide,
    clearError,
  }), [
    therapeuticPeptides,
    activeTherapeuticPeptideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticPeptide,
    clearError,
  ]);

  return (
    <TherapeuticPeptideContext.Provider value={contextValue}>
      {children}
    </TherapeuticPeptideContext.Provider>
  );
}

/**
 * Default export
 */
export default TherapeuticPeptideProvider;
