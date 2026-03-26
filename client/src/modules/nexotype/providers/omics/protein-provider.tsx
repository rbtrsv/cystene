'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useProteinStore } from '@/modules/nexotype/store/omics/protein.store';
import { type Protein } from '@/modules/nexotype/schemas/omics/protein.schemas';

/**
 * Context type for the proteins provider
 */
export interface ProteinContextType {
  // State
  proteins: Protein[];
  activeProteinId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveProtein: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ProteinContext = createContext<ProteinContextType | null>(null);

/**
 * Provider component for protein-related state and actions
 */
export function ProteinProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    proteins,
    activeProteinId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProtein,
    clearError,
  } = useProteinStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useProteinStore.persist.rehydrate();
  }, []);

  // Initialize proteins on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing proteins:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ProteinContextType>(() => ({
    proteins,
    activeProteinId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProtein,
    clearError,
  }), [
    proteins,
    activeProteinId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveProtein,
    clearError,
  ]);

  return (
    <ProteinContext.Provider value={contextValue}>
      {children}
    </ProteinContext.Provider>
  );
}

/**
 * Default export
 */
export default ProteinProvider;
