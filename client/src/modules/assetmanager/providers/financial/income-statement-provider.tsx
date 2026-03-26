'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useIncomeStatementStore } from '../../store/financial/income-statement.store';
import { type IncomeStatement } from '../../schemas/financial/income-statement.schemas';

/**
 * Context type for the income statement provider
 */
export interface IncomeStatementContextType {
  // State
  incomeStatements: IncomeStatement[];
  activeIncomeStatementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveIncomeStatement: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const IncomeStatementContext = createContext<IncomeStatementContextType | null>(null);

/**
 * Provider component for income statement-related state and actions
 */
export function IncomeStatementProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    incomeStatements,
    activeIncomeStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIncomeStatement,
    clearError,
  } = useIncomeStatementStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useIncomeStatementStore.persist.rehydrate();
  }, []);

  // Initialize income statements on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing income statements:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<IncomeStatementContextType>(() => ({
    incomeStatements,
    activeIncomeStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIncomeStatement,
    clearError,
  }), [
    incomeStatements,
    activeIncomeStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveIncomeStatement,
    clearError,
  ]);

  return (
    <IncomeStatementContext.Provider value={contextValue}>
      {children}
    </IncomeStatementContext.Provider>
  );
}

/**
 * Default export
 */
export default IncomeStatementProvider;
