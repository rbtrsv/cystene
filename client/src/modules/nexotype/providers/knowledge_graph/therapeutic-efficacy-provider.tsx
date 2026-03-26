'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTherapeuticEfficacyStore } from '@/modules/nexotype/store/knowledge_graph/therapeutic-efficacy.store';
import { type TherapeuticEfficacy } from '@/modules/nexotype/schemas/knowledge_graph/therapeutic-efficacy.schemas';

/**
 * Context type for the therapeutic efficacies provider
 */
export interface TherapeuticEfficacyContextType {
  // State
  therapeuticEfficacies: TherapeuticEfficacy[];
  activeTherapeuticEfficacyId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTherapeuticEfficacy: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TherapeuticEfficacyContext = createContext<TherapeuticEfficacyContextType | null>(null);

/**
 * Provider component for therapeutic efficacy-related state and actions
 */
export function TherapeuticEfficacyProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    therapeuticEfficacies,
    activeTherapeuticEfficacyId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticEfficacy,
    clearError,
  } = useTherapeuticEfficacyStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTherapeuticEfficacyStore.persist.rehydrate();
  }, []);

  // Initialize therapeutic efficacies on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing therapeutic efficacies:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TherapeuticEfficacyContextType>(() => ({
    therapeuticEfficacies,
    activeTherapeuticEfficacyId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticEfficacy,
    clearError,
  }), [
    therapeuticEfficacies,
    activeTherapeuticEfficacyId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticEfficacy,
    clearError,
  ]);

  return (
    <TherapeuticEfficacyContext.Provider value={contextValue}>
      {children}
    </TherapeuticEfficacyContext.Provider>
  );
}

/**
 * Default export
 */
export default TherapeuticEfficacyProvider;
