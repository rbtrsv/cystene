'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOntologyTermStore } from '@/modules/nexotype/store/standardization/ontology-term.store';
import { type OntologyTerm } from '@/modules/nexotype/schemas/standardization/ontology-term.schemas';

/**
 * Context type for the ontology terms provider
 */
export interface OntologyTermContextType {
  // State
  ontologyTerms: OntologyTerm[];
  activeOntologyTermId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveOntologyTerm: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const OntologyTermContext = createContext<OntologyTermContextType | null>(null);

/**
 * Provider component for ontology term-related state and actions
 */
export function OntologyTermProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    ontologyTerms,
    activeOntologyTermId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOntologyTerm,
    clearError,
  } = useOntologyTermStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useOntologyTermStore.persist.rehydrate();
  }, []);

  // Initialize ontology terms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing ontology terms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OntologyTermContextType>(() => ({
    ontologyTerms,
    activeOntologyTermId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOntologyTerm,
    clearError,
  }), [
    ontologyTerms,
    activeOntologyTermId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOntologyTerm,
    clearError,
  ]);

  return (
    <OntologyTermContext.Provider value={contextValue}>
      {children}
    </OntologyTermContext.Provider>
  );
}

/**
 * Default export
 */
export default OntologyTermProvider;
