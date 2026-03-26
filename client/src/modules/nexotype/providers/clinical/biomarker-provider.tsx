'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBiomarkerStore } from '@/modules/nexotype/store/clinical/biomarker.store';
import { type Biomarker } from '@/modules/nexotype/schemas/clinical/biomarker.schemas';

/**
 * Context type for the biomarkers provider
 */
export interface BiomarkerContextType {
  // State
  biomarkers: Biomarker[];
  activeBiomarkerId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBiomarker: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BiomarkerContext = createContext<BiomarkerContextType | null>(null);

/**
 * Provider component for biomarker-related state and actions
 */
export function BiomarkerProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    biomarkers,
    activeBiomarkerId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarker,
    clearError,
  } = useBiomarkerStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBiomarkerStore.persist.rehydrate();
  }, []);

  // Initialize biomarkers on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing biomarkers:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BiomarkerContextType>(() => ({
    biomarkers,
    activeBiomarkerId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarker,
    clearError,
  }), [
    biomarkers,
    activeBiomarkerId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarker,
    clearError,
  ]);

  return (
    <BiomarkerContext.Provider value={contextValue}>
      {children}
    </BiomarkerContext.Provider>
  );
}

/**
 * Default export
 */
export default BiomarkerProvider;
