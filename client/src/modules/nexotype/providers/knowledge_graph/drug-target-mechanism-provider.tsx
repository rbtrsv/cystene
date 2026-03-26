'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDrugTargetMechanismStore } from '@/modules/nexotype/store/knowledge_graph/drug-target-mechanism.store';
import { type DrugTargetMechanism } from '@/modules/nexotype/schemas/knowledge_graph/drug-target-mechanism.schemas';

/**
 * Context type for the drug target mechanisms provider
 */
export interface DrugTargetMechanismContextType {
  // State
  drugTargetMechanisms: DrugTargetMechanism[];
  activeDrugTargetMechanismId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDrugTargetMechanism: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DrugTargetMechanismContext = createContext<DrugTargetMechanismContextType | null>(null);

/**
 * Provider component for drug target mechanism-related state and actions
 */
export function DrugTargetMechanismProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    drugTargetMechanisms,
    activeDrugTargetMechanismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugTargetMechanism,
    clearError,
  } = useDrugTargetMechanismStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDrugTargetMechanismStore.persist.rehydrate();
  }, []);

  // Initialize drug target mechanisms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing drug target mechanisms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DrugTargetMechanismContextType>(() => ({
    drugTargetMechanisms,
    activeDrugTargetMechanismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugTargetMechanism,
    clearError,
  }), [
    drugTargetMechanisms,
    activeDrugTargetMechanismId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDrugTargetMechanism,
    clearError,
  ]);

  return (
    <DrugTargetMechanismContext.Provider value={contextValue}>
      {children}
    </DrugTargetMechanismContext.Provider>
  );
}

/**
 * Default export
 */
export default DrugTargetMechanismProvider;
