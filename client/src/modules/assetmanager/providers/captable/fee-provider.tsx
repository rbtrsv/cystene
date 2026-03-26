'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useFeeStore } from '../../store/captable/fee.store';
import { type Fee } from '../../schemas/captable/fee.schemas';

/**
 * Context type for the fees provider
 */
export interface FeeContextType {
  // State
  fees: Fee[];
  activeFeeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveFee: (feeId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const FeeContext = createContext<FeeContextType | null>(null);

/**
 * Provider component for fee related state and actions
 */
export function FeeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    fees,
    activeFeeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFee,
    clearError
  } = useFeeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useFeeStore.persist.rehydrate();
  }, []);

  // Initialize fees on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing fees:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FeeContextType>(() => ({
    fees,
    activeFeeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFee,
    clearError
  }), [
    fees,
    activeFeeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFee,
    clearError
  ]);

  return (
    <FeeContext.Provider value={contextValue}>
      {children}
    </FeeContext.Provider>
  );
}

/**
 * Default export
 */
export default FeeProvider;
