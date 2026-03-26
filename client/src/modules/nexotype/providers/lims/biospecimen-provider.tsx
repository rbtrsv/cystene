'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBiospecimenStore } from '@/modules/nexotype/store/lims/biospecimen.store';
import { type Biospecimen } from '@/modules/nexotype/schemas/lims/biospecimen.schemas';

/**
 * Context type for the biospecimens provider
 */
export interface BiospecimenContextType {
  // State
  biospecimens: Biospecimen[];
  activeBiospecimenId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBiospecimen: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BiospecimenContext = createContext<BiospecimenContextType | null>(null);

/**
 * Provider component for biospecimen-related state and actions
 */
export function BiospecimenProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    biospecimens,
    activeBiospecimenId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiospecimen,
    clearError,
  } = useBiospecimenStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBiospecimenStore.persist.rehydrate();
  }, []);

  // Initialize biospecimens on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing biospecimens:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BiospecimenContextType>(() => ({
    biospecimens,
    activeBiospecimenId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiospecimen,
    clearError,
  }), [
    biospecimens,
    activeBiospecimenId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiospecimen,
    clearError,
  ]);

  return (
    <BiospecimenContext.Provider value={contextValue}>
      {children}
    </BiospecimenContext.Provider>
  );
}

/**
 * Default export
 */
export default BiospecimenProvider;
