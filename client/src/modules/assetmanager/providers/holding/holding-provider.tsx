'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useHoldingStore } from '../../store/holding/holding.store';
import { type Holding } from '../../schemas/holding/holding.schemas';

/**
 * Context type for the holding provider
 */
export interface HoldingContextType {
  // State
  holdings: Holding[];
  activeHoldingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveHolding: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const HoldingContext = createContext<HoldingContextType | null>(null);

/**
 * Provider component for holding-related state and actions
 */
export function HoldingProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    holdings,
    activeHoldingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHolding,
    clearError,
  } = useHoldingStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useHoldingStore.persist.rehydrate();
  }, []);

  // Initialize holdings on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing holdings:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<HoldingContextType>(() => ({
    holdings,
    activeHoldingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHolding,
    clearError,
  }), [
    holdings,
    activeHoldingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHolding,
    clearError,
  ]);

  return (
    <HoldingContext.Provider value={contextValue}>
      {children}
    </HoldingContext.Provider>
  );
}

/**
 * Default export
 */
export default HoldingProvider;
