'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useCommitmentStore } from '../../store/captable/commitment.store';
import { type CommitmentDetail } from '../../schemas/captable/commitment.schemas';

/**
 * Context type for the commitments provider
 */
export interface CommitmentContextType {
  // State
  commitments: CommitmentDetail[];
  activeCommitmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveCommitment: (commitmentId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const CommitmentContext = createContext<CommitmentContextType | null>(null);

/**
 * Provider component for commitment related state and actions
 */
export function CommitmentProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    commitments,
    activeCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCommitment,
    clearError
  } = useCommitmentStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useCommitmentStore.persist.rehydrate();
  }, []);

  // Initialize commitments on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing commitments:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CommitmentContextType>(() => ({
    commitments,
    activeCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCommitment,
    clearError
  }), [
    commitments,
    activeCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCommitment,
    clearError
  ]);

  return (
    <CommitmentContext.Provider value={contextValue}>
      {children}
    </CommitmentContext.Provider>
  );
}

/**
 * Default export
 */
export default CommitmentProvider;
