'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useFinancialMetricsStore } from '../../store/financial/financial-metrics.store';
import { type FinancialMetrics } from '../../schemas/financial/financial-metrics.schemas';

/**
 * Context type for the financial metrics provider
 */
export interface FinancialMetricsContextType {
  // State
  financialMetrics: FinancialMetrics[];
  activeFinancialMetricsId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveFinancialMetrics: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const FinancialMetricsContext = createContext<FinancialMetricsContextType | null>(null);

/**
 * Provider component for financial metrics-related state and actions
 */
export function FinancialMetricsProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    financialMetrics,
    activeFinancialMetricsId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinancialMetrics,
    clearError,
  } = useFinancialMetricsStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useFinancialMetricsStore.persist.rehydrate();
  }, []);

  // Initialize financial metrics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing financial metrics:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FinancialMetricsContextType>(() => ({
    financialMetrics,
    activeFinancialMetricsId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinancialMetrics,
    clearError,
  }), [
    financialMetrics,
    activeFinancialMetricsId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinancialMetrics,
    clearError,
  ]);

  return (
    <FinancialMetricsContext.Provider value={contextValue}>
      {children}
    </FinancialMetricsContext.Provider>
  );
}

/**
 * Default export
 */
export default FinancialMetricsProvider;
