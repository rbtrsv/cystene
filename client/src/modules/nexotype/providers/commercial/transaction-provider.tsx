'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTransactionStore } from '@/modules/nexotype/store/commercial/transaction.store';
import { type Transaction } from '@/modules/nexotype/schemas/commercial/transaction.schemas';

/**
 * Context type for the transactions provider
 */
export interface TransactionContextType {
  // State
  transactions: Transaction[];
  activeTransactionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTransaction: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TransactionContext = createContext<TransactionContextType | null>(null);

/**
 * Provider component for transaction-related state and actions
 */
export function TransactionProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    transactions,
    activeTransactionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError,
  } = useTransactionStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTransactionStore.persist.rehydrate();
  }, []);

  // Initialize transactions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing transactions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TransactionContextType>(() => ({
    transactions,
    activeTransactionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError,
  }), [
    transactions,
    activeTransactionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError,
  ]);

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

/**
 * Default export
 */
export default TransactionProvider;
