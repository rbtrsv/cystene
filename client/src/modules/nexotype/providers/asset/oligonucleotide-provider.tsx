'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOligonucleotideStore } from '@/modules/nexotype/store/asset/oligonucleotide.store';
import { type Oligonucleotide } from '@/modules/nexotype/schemas/asset/oligonucleotide.schemas';

/**
 * Context type for the oligonucleotides provider
 */
export interface OligonucleotideContextType {
  // State
  oligonucleotides: Oligonucleotide[];
  activeOligonucleotideId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveOligonucleotide: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const OligonucleotideContext = createContext<OligonucleotideContextType | null>(null);

/**
 * Provider component for oligonucleotide-related state and actions
 */
export function OligonucleotideProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    oligonucleotides,
    activeOligonucleotideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOligonucleotide,
    clearError,
  } = useOligonucleotideStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useOligonucleotideStore.persist.rehydrate();
  }, []);

  // Initialize oligonucleotides on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing oligonucleotides:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OligonucleotideContextType>(() => ({
    oligonucleotides,
    activeOligonucleotideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOligonucleotide,
    clearError,
  }), [
    oligonucleotides,
    activeOligonucleotideId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOligonucleotide,
    clearError,
  ]);

  return (
    <OligonucleotideContext.Provider value={contextValue}>
      {children}
    </OligonucleotideContext.Provider>
  );
}

/**
 * Default export
 */
export default OligonucleotideProvider;
