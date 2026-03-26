'use client';

import { useTransactionsContext } from '../providers/transactions-provider';
import { useTransactionsStore } from '../store/transactions.store';
import { 
  type Transaction, 
  type TransactionWithDetails,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionType
} from '../schemas/transactions.schemas';

/**
 * Custom hook that combines transactions context and store
 * to provide a simplified interface for transaction functionality
 * 
 * @returns Transaction utilities and state
 */
export function useTransactions() {
  // Get data from transactions context
  const {
    transactions,
    selectedTransaction,
    transactionDetails,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    fetchTransactions,
    fetchTransaction,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    setSelectedTransaction,
    clearError: clearContextError
  } = useTransactionsContext();

  // Get additional actions from transactions store
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createInvestmentTransaction,
    createSecurityTransfer,
    createDividendTransaction,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useTransactionsStore();

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
    selectedTransaction,
    transactionDetails,
    isLoading,
    error,
    isInitialized,
    
    // Fetch actions
    fetchTransactions,
    fetchTransaction,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    
    // CRUD actions
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Specialized transaction creation
    createInvestmentTransaction,
    createSecurityTransfer,
    createDividendTransaction,
    
    // State management
    setSelectedTransaction,
    clearError,
    
    // Helper methods
    getTransactionById: (id: number) => transactions.find(t => t.id === id),
    
    getTransactionTypeLabel: (type: TransactionType): string => {
      const typeLabels: Record<TransactionType, string> = {
        // Entity Perspective: Primary transaction types
        'ISSUANCE': 'Issuance',
        'DISTRIBUTION': 'Distribution',
        'REDEMPTION': 'Redemption',
        // Transfer transactions
        'TRANSFER_IN': 'Transfer In',
        'TRANSFER_OUT': 'Transfer Out',
        // Legacy/Other cash transactions
        'CASH_IN': 'Cash In',
        'CASH_OUT': 'Cash Out',
        'COUPON_IN': 'Coupon In',
        'COUPON_OUT': 'Coupon Out',
        // Share related transactions
        'CONVERSION_IN': 'Conversion In',
        'CONVERSION_OUT': 'Conversion Out',
        'SPLIT': 'Split',
        'CONSOLIDATION': 'Consolidation',
        // Option related transactions
        'GRANT': 'Grant',
        'VEST': 'Vest',
        'EXERCISE': 'Exercise',
        'EXPIRE': 'Expire',
        'FORFEIT': 'Forfeit',
        'CANCEL': 'Cancel',
        // Financial transactions
        'DIVIDEND': 'Dividend',
        'INTEREST': 'Interest',
        'ADJUSTMENT': 'Adjustment'
      };

      return typeLabels[type] || type;
    },
    
    formatCurrency: (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },
    
    formatUnits: (units: number): string => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      }).format(units);
    },
    
    formatDate: (date: Date | string): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    // Calculate transaction amount (positive for debit, negative for credit)
    getTransactionAmount: (transaction: Transaction): number => {
      return transaction.amountDebit - transaction.amountCredit;
    },
    
    // Calculate transaction units (Entity Perspective: unitsCredit - unitsDebit)
    // - unitsCredit = Fund issues units TO stakeholder (stakeholder receives)
    // - unitsDebit = Fund redeems units FROM stakeholder (stakeholder loses)
    getTransactionUnits: (transaction: Transaction): number => {
      return transaction.unitsCredit - transaction.unitsDebit;
    },

    // Determine if a transaction is a cash transaction
    isCashTransaction: (transaction: Transaction): boolean => {
      return transaction.amountDebit > 0 || transaction.amountCredit > 0;
    },

    // Determine if a transaction is a units transaction
    isUnitsTransaction: (transaction: Transaction): boolean => {
      return transaction.unitsDebit > 0 || transaction.unitsCredit > 0;
    },

    // Get transaction direction from stakeholder's perspective
    // Entity Perspective: unitsCredit = stakeholder receives, unitsDebit = stakeholder loses
    getTransactionDirection: (transaction: Transaction): 'in' | 'out' | 'neutral' => {
      const amount = transaction.amountDebit - transaction.amountCredit;
      const units = transaction.unitsCredit - transaction.unitsDebit;

      // For stakeholder: units > 0 means receiving units (in), amount > 0 means fund received cash (stakeholder paid out)
      if (units > 0) return 'in';  // Stakeholder receives units
      if (units < 0) return 'out'; // Stakeholder loses units
      if (amount > 0) return 'out'; // Stakeholder paid cash to fund
      if (amount < 0) return 'in';  // Stakeholder received cash from fund
      return 'neutral';
    }
  };
}

export default useTransactions;
