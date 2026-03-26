'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useHoldingPerformanceStore } from '../../store/holding/holding-performance.store';
import { type HoldingPerformance } from '../../schemas/holding/holding-performance.schemas';

/**
 * Context type for the holding performance provider
 */
export interface HoldingPerformanceContextType {
  // State
  holdingPerformances: HoldingPerformance[];
  activeHoldingPerformanceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveHoldingPerformance: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const HoldingPerformanceContext = createContext<HoldingPerformanceContextType | null>(null);

/**
 * Provider component for holding performance-related state and actions
 */
export function HoldingPerformanceProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    holdingPerformances,
    activeHoldingPerformanceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingPerformance,
    clearError,
  } = useHoldingPerformanceStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useHoldingPerformanceStore.persist.rehydrate();
  }, []);

  // Initialize holding performances on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing holding performances:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<HoldingPerformanceContextType>(() => ({
    holdingPerformances,
    activeHoldingPerformanceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingPerformance,
    clearError,
  }), [
    holdingPerformances,
    activeHoldingPerformanceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveHoldingPerformance,
    clearError,
  ]);

  return (
    <HoldingPerformanceContext.Provider value={contextValue}>
      {children}
    </HoldingPerformanceContext.Provider>
  );
}

/**
 * Default export
 */
export default HoldingPerformanceProvider;
