'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useCandidateStore } from '@/modules/nexotype/store/engineering/candidate.store';
import { type Candidate } from '@/modules/nexotype/schemas/engineering/candidate.schemas';

/**
 * Context type for the candidates provider
 */
export interface CandidateContextType {
  // State
  candidates: Candidate[];
  activeCandidateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveCandidate: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const CandidateContext = createContext<CandidateContextType | null>(null);

/**
 * Provider component for candidate-related state and actions
 */
export function CandidateProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    candidates,
    activeCandidateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCandidate,
    clearError,
  } = useCandidateStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useCandidateStore.persist.rehydrate();
  }, []);

  // Initialize candidates on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing candidates:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CandidateContextType>(() => ({
    candidates,
    activeCandidateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCandidate,
    clearError,
  }), [
    candidates,
    activeCandidateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCandidate,
    clearError,
  ]);

  return (
    <CandidateContext.Provider value={contextValue}>
      {children}
    </CandidateContext.Provider>
  );
}

/**
 * Default export
 */
export default CandidateProvider;
