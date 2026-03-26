'use client';

import { useContext } from 'react';
import { TransactionContext, TransactionContextType } from '@/modules/nexotype/providers/commercial/transaction-provider';
import { useTransactionStore } from '@/modules/nexotype/store/commercial/transaction.store';
import {
  type Transaction,
  type CreateTransaction,
  type UpdateTransaction,
} from '@/modules/nexotype/schemas/commercial/transaction.schemas';
import { ListTransactionsParams } from '@/modules/nexotype/service/commercial/transaction.service';

/**
 * Hook to use the transaction context
 * @throws Error if used outside of a TransactionProvider
 */
export function useTransactionContext(): TransactionContextType {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }

  return context;
}

/**
 * Custom hook that combines transaction context and store
 * to provide a simplified interface for transaction functionality
 *
 * @returns Transaction utilities and state
 */
export function useTransactions() {
  // Get data from transaction context
  const {
    transactions,
    activeTransactionId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError: clearContextError,
  } = useTransactionContext();

  // Get additional actions from transaction store
  const {
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTransactionStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active transaction
  const activeTransaction = transactions.find((item: Transaction) => item.id === activeTransactionId) || null;

  return {
    // State
    transactions,
    activeTransactionId,
    activeTransaction,
    isLoading,
    error,
    isInitialized,

    // Transaction actions
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setActiveTransaction,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return transactions.find((item: Transaction) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTransactionsParams) => {
      return await fetchTransactions(filters);
    },
    createWithData: async (data: CreateTransaction) => {
      return await createTransaction(data);
    },
    updateWithData: async (id: number, data: UpdateTransaction) => {
      return await updateTransaction(id, data);
    },
  };
}

export default useTransactions;
