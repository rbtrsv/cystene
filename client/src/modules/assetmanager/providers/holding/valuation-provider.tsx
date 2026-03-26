'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useValuationStore } from '../../store/holding/valuation.store';
import { type Valuation } from '../../schemas/holding/valuation.schemas';

/**
 * Context type for the valuation provider
 */
export interface ValuationContextType {
  // State
  valuations: Valuation[];
  activeValuationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveValuation: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ValuationContext = createContext<ValuationContextType | null>(null);

/**
 * Provider component for valuation-related state and actions
 */
export function ValuationProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    valuations,
    activeValuationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveValuation,
    clearError,
  } = useValuationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useValuationStore.persist.rehydrate();
  }, []);

  // Initialize valuations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing valuations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ValuationContextType>(() => ({
    valuations,
    activeValuationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveValuation,
    clearError,
  }), [
    valuations,
    activeValuationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveValuation,
    clearError,
  ]);

  return (
    <ValuationContext.Provider value={contextValue}>
      {children}
    </ValuationContext.Provider>
  );
}

/**
 * Default export
 */
export default ValuationProvider;
