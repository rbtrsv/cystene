'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { 
  type Transaction,
  type TransactionWithDetails
} from '../schemas/transactions.schemas';
import { useTransactionsStore } from '../store/transactions.store';

// Define the context type
interface TransactionsContextType {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  transactionDetails: TransactionWithDetails | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  fetchTransactions: () => Promise<boolean>;
  fetchTransaction: (id: number) => Promise<boolean>;
  fetchTransactionsByStakeholder: (stakeholderId: number) => Promise<boolean>;
  fetchTransactionsBySecurity: (securityId: number) => Promise<boolean>;
  setSelectedTransaction: (transaction: Transaction | null) => void;
  clearError: () => void;
}

// Create the context with default values
const TransactionsContext = createContext<TransactionsContextType>({
  transactions: [],
  selectedTransaction: null,
  transactionDetails: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  
  // Default action implementations (will be overridden by provider)
  fetchTransactions: async () => false,
  fetchTransaction: async () => false,
  fetchTransactionsByStakeholder: async () => false,
  fetchTransactionsBySecurity: async () => false,
  setSelectedTransaction: () => {},
  clearError: () => {}
});

// Provider props type
interface TransactionsProviderProps {
  children: React.ReactNode;
  initialFetch?: boolean;
}

/**
 * Transactions Provider Component
 * Provides transactions data and actions to all child components
 */
export function TransactionsProvider({ 
  children, 
  initialFetch = true 
}: TransactionsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get data and actions from the transactions store
  const { 
    transactions,
    selectedTransaction,
    transactionDetails,
    isLoading,
    error,
    fetchTransactions,
    fetchTransaction,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    setSelectedTransaction,
    clearError
  } = useTransactionsStore();
  
  // Initialize the provider
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (!isInitialized && isMounted && initialFetch) {
        try {
          // Fetch initial transactions data
          await fetchTransactions();
          if (isMounted) {
            setIsInitialized(true);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error initializing transactions:', error);
          }
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, [isInitialized, fetchTransactions, initialFetch]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TransactionsContextType>(() => ({
    transactions,
    selectedTransaction,
    transactionDetails,
    isLoading,
    error,
    isInitialized,
    fetchTransactions,
    fetchTransaction,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    setSelectedTransaction,
    clearError
  }), [
    transactions,
    selectedTransaction,
    transactionDetails,
    isLoading,
    error,
    isInitialized,
    fetchTransactions,
    fetchTransaction,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    setSelectedTransaction,
    clearError
  ]);
  
  return (
    <TransactionsContext.Provider value={contextValue}>
      {children}
    </TransactionsContext.Provider>
  );
}

/**
 * Hook to use the transactions context
 * @returns Transactions context
 */
export function useTransactionsContext(): TransactionsContextType {
  const context = useContext(TransactionsContext);
  
  if (!context) {
    throw new Error('useTransactionsContext must be used within a TransactionsProvider');
  }
  
  return context;
}
