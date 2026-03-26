'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBioactivityStore } from '@/modules/nexotype/store/knowledge_graph/bioactivity.store';
import { type Bioactivity } from '@/modules/nexotype/schemas/knowledge_graph/bioactivity.schemas';

/**
 * Context type for the bioactivities provider
 */
export interface BioactivityContextType {
  // State
  bioactivities: Bioactivity[];
  activeBioactivityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBioactivity: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BioactivityContext = createContext<BioactivityContextType | null>(null);

/**
 * Provider component for bioactivity-related state and actions
 */
export function BioactivityProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    bioactivities,
    activeBioactivityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBioactivity,
    clearError,
  } = useBioactivityStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBioactivityStore.persist.rehydrate();
  }, []);

  // Initialize bioactivities on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing bioactivities:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BioactivityContextType>(() => ({
    bioactivities,
    activeBioactivityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBioactivity,
    clearError,
  }), [
    bioactivities,
    activeBioactivityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBioactivity,
    clearError,
  ]);

  return (
    <BioactivityContext.Provider value={contextValue}>
      {children}
    </BioactivityContext.Provider>
  );
}

/**
 * Default export
 */
export default BioactivityProvider;
