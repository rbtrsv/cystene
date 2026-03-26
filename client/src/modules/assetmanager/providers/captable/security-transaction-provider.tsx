'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSecurityTransactionStore } from '../../store/captable/security-transaction.store';
import { type SecurityTransaction } from '../../schemas/captable/security-transaction.schemas';

/**
 * Context type for the security transactions provider
 */
export interface SecurityTransactionContextType {
  // State
  transactions: SecurityTransaction[];
  activeTransactionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTransaction: (transactionId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SecurityTransactionContext = createContext<SecurityTransactionContextType | null>(null);

/**
 * Provider component for security transaction related state and actions
 */
export function SecurityTransactionProvider({
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
    clearError
  } = useSecurityTransactionStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSecurityTransactionStore.persist.rehydrate();
  }, []);

  // Initialize security transactions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing security transactions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SecurityTransactionContextType>(() => ({
    transactions,
    activeTransactionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError
  }), [
    transactions,
    activeTransactionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError
  ]);

  return (
    <SecurityTransactionContext.Provider value={contextValue}>
      {children}
    </SecurityTransactionContext.Provider>
  );
}

/**
 * Default export
 */
export default SecurityTransactionProvider;
