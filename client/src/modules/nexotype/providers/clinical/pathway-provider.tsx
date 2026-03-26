'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePathwayStore } from '@/modules/nexotype/store/clinical/pathway.store';
import { type Pathway } from '@/modules/nexotype/schemas/clinical/pathway.schemas';

/**
 * Context type for the pathways provider
 */
export interface PathwayContextType {
  // State
  pathways: Pathway[];
  activePathwayId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePathway: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PathwayContext = createContext<PathwayContextType | null>(null);

/**
 * Provider component for pathway-related state and actions
 */
export function PathwayProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    pathways,
    activePathwayId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathway,
    clearError,
  } = usePathwayStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePathwayStore.persist.rehydrate();
  }, []);

  // Initialize pathways on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing pathways:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PathwayContextType>(() => ({
    pathways,
    activePathwayId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathway,
    clearError,
  }), [
    pathways,
    activePathwayId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathway,
    clearError,
  ]);

  return (
    <PathwayContext.Provider value={contextValue}>
      {children}
    </PathwayContext.Provider>
  );
}

/**
 * Default export
 */
export default PathwayProvider;
