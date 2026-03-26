'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useFundingRoundStore } from '../../store/captable/funding-round.store';
import { type FundingRound } from '../../schemas/captable/funding-round.schemas';

/**
 * Context type for the funding rounds provider
 */
export interface FundingRoundContextType {
  // State
  fundingRounds: FundingRound[];
  activeFundingRoundId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveFundingRound: (fundingRoundId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const FundingRoundContext = createContext<FundingRoundContextType | null>(null);

/**
 * Provider component for funding round related state and actions
 */
export function FundingRoundProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    fundingRounds,
    activeFundingRoundId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFundingRound,
    clearError
  } = useFundingRoundStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useFundingRoundStore.persist.rehydrate();
  }, []);

  // Initialize funding rounds on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing funding rounds:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FundingRoundContextType>(() => ({
    fundingRounds,
    activeFundingRoundId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFundingRound,
    clearError
  }), [
    fundingRounds,
    activeFundingRoundId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFundingRound,
    clearError
  ]);

  return (
    <FundingRoundContext.Provider value={contextValue}>
      {children}
    </FundingRoundContext.Provider>
  );
}

/**
 * Default export
 */
export default FundingRoundProvider;
