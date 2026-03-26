'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOrganismStore } from '@/modules/nexotype/store/omics/organism.store';
import { type Organism } from '@/modules/nexotype/schemas/omics/organism.schemas';

/**
 * Context type for the organisms provider
 */
export interface OrganismContextType {
  // State
  organisms: Organism[];
  activeOrganismId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveOrganism: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const OrganismContext = createContext<OrganismContextType | null>(null);

/**
 * Provider component for organism-related state and actions
 */
export function OrganismProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    organisms,
    activeOrganismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganism,
    clearError,
  } = useOrganismStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useOrganismStore.persist.rehydrate();
  }, []);

  // Initialize organisms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing organisms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OrganismContextType>(() => ({
    organisms,
    activeOrganismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganism,
    clearError,
  }), [
    organisms,
    activeOrganismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganism,
    clearError,
  ]);

  return (
    <OrganismContext.Provider value={contextValue}>
      {children}
    </OrganismContext.Provider>
  );
}

/**
 * Default export
 */
export default OrganismProvider;
