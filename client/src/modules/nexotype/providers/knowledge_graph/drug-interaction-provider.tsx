'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDrugInteractionStore } from '@/modules/nexotype/store/knowledge_graph/drug-interaction.store';
import { type DrugInteraction } from '@/modules/nexotype/schemas/knowledge_graph/drug-interaction.schemas';

/**
 * Context type for the drug interactions provider
 */
export interface DrugInteractionContextType {
  // State
  drugInteractions: DrugInteraction[];
  activeDrugInteractionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDrugInteraction: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DrugInteractionContext = createContext<DrugInteractionContextType | null>(null);

/**
 * Provider component for drug interaction-related state and actions
 */
export function DrugInteractionProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    drugInteractions,
    activeDrugInteractionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugInteraction,
    clearError,
  } = useDrugInteractionStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDrugInteractionStore.persist.rehydrate();
  }, []);

  // Initialize drug interactions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing drug interactions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DrugInteractionContextType>(() => ({
    drugInteractions,
    activeDrugInteractionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugInteraction,
    clearError,
  }), [
    drugInteractions,
    activeDrugInteractionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugInteraction,
    clearError,
  ]);

  return (
    <DrugInteractionContext.Provider value={contextValue}>
      {children}
    </DrugInteractionContext.Provider>
  );
}

/**
 * Default export
 */
export default DrugInteractionProvider;
