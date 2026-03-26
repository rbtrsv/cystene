'use client';

import { useContext } from 'react';
import { SyndicateTransactionsContext, SyndicateTransactionsContextType } from '../../providers/entity/syndicate-transaction-provider';
import { useSyndicateTransactionsStore } from '../../store/entity/syndicate-transaction.store';
import {
  type SyndicateTransaction,
  type CreateSyndicateTransaction,
  type UpdateSyndicateTransaction
} from '../../schemas/entity/syndicate-transaction.schemas';
import { ListSyndicateTransactionsParams } from '../../service/entity/syndicate-transaction.service';

/**
 * Hook to use the syndicate transactions context
 * @throws Error if used outside of a SyndicateTransactionsProvider
 */
export function useSyndicateTransactionsContext(): SyndicateTransactionsContextType {
  const context = useContext(SyndicateTransactionsContext);

  if (!context) {
    throw new Error('useSyndicateTransactionsContext must be used within a SyndicateTransactionsProvider');
  }

  return context;
}

/**
 * Custom hook that combines syndicate transactions context and store
 * to provide a simplified interface for syndicate transaction functionality
 *
 * @returns Syndicate transaction utilities and state
 */
export function useSyndicateTransactions() {
  // Get data from syndicate transactions context
  const {
    transactions,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useSyndicateTransactionsContext();

  // Get additional actions from syndicate transactions store
  const {
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSyndicateTransactionsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    transactions,
    isLoading,
    error,
    isInitialized,

    // Transaction actions
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    initialize,
    clearError,

    // Helper methods
    hasTransactions: transactions.length > 0,
    getTransactionCount: () => transactions.length,
    getTransactionById: (id: number) => {
      return transactions.find((transaction: SyndicateTransaction) => transaction.id === id);
    },
    getTransactionsBySyndicate: (syndicateId: number) => {
      return transactions.filter((transaction: SyndicateTransaction) => transaction.syndicate_id === syndicateId);
    },
    getTransactionsBySeller: (sellerEntityId: number) => {
      return transactions.filter((transaction: SyndicateTransaction) => transaction.seller_entity_id === sellerEntityId);
    },
    getTransactionsByBuyer: (buyerEntityId: number) => {
      return transactions.filter((transaction: SyndicateTransaction) => transaction.buyer_entity_id === buyerEntityId);
    },
    getTransactionsByStatus: (status: string) => {
      return transactions.filter((transaction: SyndicateTransaction) => transaction.status === status);
    },

    // Convenience wrapper functions
    fetchTransactionsWithFilters: async (filters: ListSyndicateTransactionsParams) => {
      return await fetchTransactions(filters);
    },
    createTransactionWithData: async (data: CreateSyndicateTransaction) => {
      return await createTransaction(data);
    },
    updateTransactionData: async (id: number, data: UpdateSyndicateTransaction) => {
      return await updateTransaction(id, data);
    }
  };
}

export default useSyndicateTransactions;
