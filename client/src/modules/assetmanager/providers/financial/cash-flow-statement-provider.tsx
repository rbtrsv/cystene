'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useCashFlowStatementStore } from '../../store/financial/cash-flow-statement.store';
import { type CashFlowStatement } from '../../schemas/financial/cash-flow-statement.schemas';

/**
 * Context type for the cash flow statement provider
 */
export interface CashFlowStatementContextType {
  // State
  cashFlowStatements: CashFlowStatement[];
  activeCashFlowStatementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveCashFlowStatement: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const CashFlowStatementContext = createContext<CashFlowStatementContextType | null>(null);

/**
 * Provider component for cash flow statement-related state and actions
 */
export function CashFlowStatementProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    cashFlowStatements,
    activeCashFlowStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCashFlowStatement,
    clearError,
  } = useCashFlowStatementStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useCashFlowStatementStore.persist.rehydrate();
  }, []);

  // Initialize cash flow statements on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing cash flow statements:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CashFlowStatementContextType>(() => ({
    cashFlowStatements,
    activeCashFlowStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCashFlowStatement,
    clearError,
  }), [
    cashFlowStatements,
    activeCashFlowStatementId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveCashFlowStatement,
    clearError,
  ]);

  return (
    <CashFlowStatementContext.Provider value={contextValue}>
      {children}
    </CashFlowStatementContext.Provider>
  );
}

/**
 * Default export
 */
export default CashFlowStatementProvider;
