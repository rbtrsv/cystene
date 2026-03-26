'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDealCommitmentStore } from '../../store/deal/deal-commitment.store';
import { type DealCommitment } from '../../schemas/deal/deal-commitment.schemas';

/**
 * Context type for the deal commitment provider
 */
export interface DealCommitmentContextType {
  // State
  dealCommitments: DealCommitment[];
  activeDealCommitmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDealCommitment: (commitmentId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DealCommitmentContext = createContext<DealCommitmentContextType | null>(null);

/**
 * Provider component for deal commitment-related state and actions
 */
export function DealCommitmentProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    dealCommitments,
    activeDealCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealCommitment,
    clearError,
  } = useDealCommitmentStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDealCommitmentStore.persist.rehydrate();
  }, []);

  // Initialize deal commitment on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((initError) => {
        if (isMounted) {
          console.error('Error initializing deal commitments:', initError);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DealCommitmentContextType>(() => ({
    dealCommitments,
    activeDealCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealCommitment,
    clearError,
  }), [
    dealCommitments,
    activeDealCommitmentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealCommitment,
    clearError,
  ]);

  return (
    <DealCommitmentContext.Provider value={contextValue}>
      {children}
    </DealCommitmentContext.Provider>
  );
}

/**
 * Default export
 */
export default DealCommitmentProvider;
