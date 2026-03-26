'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBalanceSheetStore } from '../../store/financial/balance-sheet.store';
import { type BalanceSheet } from '../../schemas/financial/balance-sheet.schemas';

/**
 * Context type for the balance sheet provider
 */
export interface BalanceSheetContextType {
  // State
  balanceSheets: BalanceSheet[];
  activeBalanceSheetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBalanceSheet: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BalanceSheetContext = createContext<BalanceSheetContextType | null>(null);

/**
 * Provider component for balance sheet-related state and actions
 */
export function BalanceSheetProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    balanceSheets,
    activeBalanceSheetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBalanceSheet,
    clearError,
  } = useBalanceSheetStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBalanceSheetStore.persist.rehydrate();
  }, []);

  // Initialize balance sheets on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing balance sheets:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BalanceSheetContextType>(() => ({
    balanceSheets,
    activeBalanceSheetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBalanceSheet,
    clearError,
  }), [
    balanceSheets,
    activeBalanceSheetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBalanceSheet,
    clearError,
  ]);

  return (
    <BalanceSheetContext.Provider value={contextValue}>
      {children}
    </BalanceSheetContext.Provider>
  );
}

/**
 * Default export
 */
export default BalanceSheetProvider;
