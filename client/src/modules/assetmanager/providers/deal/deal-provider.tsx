'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDealStore } from '../../store/deal/deal.store';
import { type Deal } from '../../schemas/deal/deal.schemas';

/**
 * Context type for the deal provider
 */
export interface DealContextType {
  // State
  deals: Deal[];
  activeDealId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDeal: (dealId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DealContext = createContext<DealContextType | null>(null);

/**
 * Provider component for deal-related state and actions
 */
export function DealProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    deals,
    activeDealId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDeal,
    clearError,
  } = useDealStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDealStore.persist.rehydrate();
  }, []);

  // Initialize deal on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((initError) => {
        if (isMounted) {
          console.error('Error initializing deals:', initError);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DealContextType>(() => ({
    deals,
    activeDealId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDeal,
    clearError,
  }), [
    deals,
    activeDealId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDeal,
    clearError,
  ]);

  return (
    <DealContext.Provider value={contextValue}>
      {children}
    </DealContext.Provider>
  );
}

/**
 * Default export
 */
export default DealProvider;
