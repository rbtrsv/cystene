'use client';

import { useContext } from 'react';
import { SecurityTransactionContext, SecurityTransactionContextType } from '../../providers/captable/security-transaction-provider';
import { useSecurityTransactionStore } from '../../store/captable/security-transaction.store';
import {
  type SecurityTransaction,
  type CreateSecurityTransaction,
  type UpdateSecurityTransaction,
  type TransactionType,
  getTransactionTypeLabel,
  calculateNetAmount,
  calculateNetUnits,
} from '../../schemas/captable/security-transaction.schemas';
import { ListSecurityTransactionsParams } from '../../service/captable/security-transaction.service';

/**
 * Hook to use the security transaction context
 * @throws Error if used outside of a SecurityTransactionProvider
 */
export function useSecurityTransactionContext(): SecurityTransactionContextType {
  const context = useContext(SecurityTransactionContext);

  if (!context) {
    throw new Error('useSecurityTransactionContext must be used within a SecurityTransactionProvider');
  }

  return context;
}

/**
 * Custom hook that combines security transaction context and store
 * to provide a simplified interface for security transaction functionality
 *
 * @returns Security transaction utilities and state
 */
export function useSecurityTransactions() {
  // Get data from security transaction context
  const {
    transactions,
    activeTransactionId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTransaction,
    clearError: clearContextError
  } = useSecurityTransactionContext();

  // Get additional actions from security transaction store
  const {
    fetchSecurityTransactions,
    fetchSecurityTransaction,
    createSecurityTransaction,
    updateSecurityTransaction,
    deleteSecurityTransaction,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSecurityTransactionStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active transaction
  const activeTransaction = transactions.find((t: SecurityTransaction) => t.id === activeTransactionId) || null;

  return {
    // State
    transactions,
    activeTransactionId,
    activeTransaction,
    isLoading,
    error,
    isInitialized,

    // Security transaction actions
    fetchSecurityTransactions,
    fetchSecurityTransaction,
    createSecurityTransaction,
    updateSecurityTransaction,
    deleteSecurityTransaction,
    setActiveTransaction,
    initialize,
    clearError,

    // Helper methods
    getSecurityTransactionById: (id: number) => {
      return transactions.find((t: SecurityTransaction) => t.id === id);
    },
    getTransactionsByStakeholder: (stakeholderId: number) => {
      return transactions.filter((t: SecurityTransaction) => t.stakeholder_id === stakeholderId);
    },
    getTransactionsBySecurity: (securityId: number) => {
      return transactions.filter((t: SecurityTransaction) => t.security_id === securityId);
    },
    getTransactionsByFundingRound: (fundingRoundId: number) => {
      return transactions.filter((t: SecurityTransaction) => t.funding_round_id === fundingRoundId);
    },
    getTransactionsByType: (transactionType: TransactionType) => {
      return transactions.filter((t: SecurityTransaction) => t.transaction_type === transactionType);
    },

    // Helpers re-exported from schema for convenience
    getTransactionTypeLabel,
    calculateNetAmount,
    calculateNetUnits,

    // Convenience wrapper functions
    fetchTransactionsWithFilters: async (filters: ListSecurityTransactionsParams) => {
      return await fetchSecurityTransactions(filters);
    },
    createTransactionWithData: async (data: CreateSecurityTransaction) => {
      return await createSecurityTransaction(data);
    },
    updateTransactionWithData: async (id: number, data: UpdateSecurityTransaction) => {
      return await updateSecurityTransaction(id, data);
    }
  };
}

export default useSecurityTransactions;
