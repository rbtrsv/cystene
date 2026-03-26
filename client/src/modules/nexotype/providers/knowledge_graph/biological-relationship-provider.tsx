'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBiologicalRelationshipStore } from '@/modules/nexotype/store/knowledge_graph/biological-relationship.store';
import { type BiologicalRelationship } from '@/modules/nexotype/schemas/knowledge_graph/biological-relationship.schemas';

/**
 * Context type for the biological relationships provider
 */
export interface BiologicalRelationshipContextType {
  // State
  biologicalRelationships: BiologicalRelationship[];
  activeBiologicalRelationshipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBiologicalRelationship: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BiologicalRelationshipContext = createContext<BiologicalRelationshipContextType | null>(null);

/**
 * Provider component for biological relationship-related state and actions
 */
export function BiologicalRelationshipProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    biologicalRelationships,
    activeBiologicalRelationshipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologicalRelationship,
    clearError,
  } = useBiologicalRelationshipStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBiologicalRelationshipStore.persist.rehydrate();
  }, []);

  // Initialize biological relationships on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing biological relationships:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BiologicalRelationshipContextType>(() => ({
    biologicalRelationships,
    activeBiologicalRelationshipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologicalRelationship,
    clearError,
  }), [
    biologicalRelationships,
    activeBiologicalRelationshipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologicalRelationship,
    clearError,
  ]);

  return (
    <BiologicalRelationshipContext.Provider value={contextValue}>
      {children}
    </BiologicalRelationshipContext.Provider>
  );
}

/**
 * Default export
 */
export default BiologicalRelationshipProvider;
