'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useEvidenceAssertionStore } from '@/modules/nexotype/store/knowledge_graph/evidence-assertion.store';
import { type EvidenceAssertion } from '@/modules/nexotype/schemas/knowledge_graph/evidence-assertion.schemas';

/**
 * Context type for the evidence assertions provider
 */
export interface EvidenceAssertionContextType {
  // State
  evidenceAssertions: EvidenceAssertion[];
  activeEvidenceAssertionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveEvidenceAssertion: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const EvidenceAssertionContext = createContext<EvidenceAssertionContextType | null>(null);

/**
 * Provider component for evidence assertion-related state and actions
 */
export function EvidenceAssertionProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    evidenceAssertions,
    activeEvidenceAssertionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEvidenceAssertion,
    clearError,
  } = useEvidenceAssertionStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useEvidenceAssertionStore.persist.rehydrate();
  }, []);

  // Initialize evidence assertions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing evidence assertions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<EvidenceAssertionContextType>(() => ({
    evidenceAssertions,
    activeEvidenceAssertionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEvidenceAssertion,
    clearError,
  }), [
    evidenceAssertions,
    activeEvidenceAssertionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEvidenceAssertion,
    clearError,
  ]);

  return (
    <EvidenceAssertionContext.Provider value={contextValue}>
      {children}
    </EvidenceAssertionContext.Provider>
  );
}

/**
 * Default export
 */
export default EvidenceAssertionProvider;
