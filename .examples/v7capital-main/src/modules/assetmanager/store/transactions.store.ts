'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Transaction,
  type TransactionWithDetails,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionType
} from '../schemas/transactions.schemas';
import {
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getTransaction as apiGetTransaction,
  getTransactions as apiGetTransactions,
  getTransactionsByStakeholder as apiGetTransactionsByStakeholder,
  getTransactionsBySecurity as apiGetTransactionsBySecurity,
  getTransactionsByRound as apiGetTransactionsByRound,
  createInvestmentTransaction as apiCreateInvestmentTransaction,
  createSecurityTransfer as apiCreateSecurityTransfer,
  createDividendTransaction as apiCreateDividendTransaction
} from '../actions/transactions.actions';

/**
 * Transactions store state interface
 */
export interface TransactionsState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  transactionDetails: TransactionWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // Fetch actions
  fetchTransactions: () => Promise<boolean>;
  fetchTransaction: (id: number) => Promise<boolean>;
  fetchTransactionsByStakeholder: (stakeholderId: number) => Promise<boolean>;
  fetchTransactionsBySecurity: (securityId: number) => Promise<boolean>;
  fetchTransactionsByRound: (roundId: number) => Promise<boolean>;
  
  // CRUD actions
  createTransaction: (data: CreateTransactionInput) => Promise<boolean>;
  updateTransaction: (id: number, data: UpdateTransactionInput) => Promise<boolean>;
  deleteTransaction: (id: number) => Promise<boolean>;
  
  // Specialized transaction creation
  createInvestmentTransaction: (
    fundId: number,
    investorStakeholderId: number,
    securityId: number,
    roundId: number,
    units: number,
    amount: number,
    transactionDate: Date | string,
    notes?: string
  ) => Promise<boolean>;
  
  createSecurityTransfer: (
    fromStakeholderId: number,
    toStakeholderId: number,
    securityId: number,
    fundId: number,
    roundId: number,
    units: number,
    transactionDate: Date | string,
    notes?: string
  ) => Promise<boolean>;
  
  createDividendTransaction: (
    fundId: number,
    stakeholderId: number,
    securityId: number,
    roundId: number,
    amount: number,
    transactionDate: Date | string,
    notes?: string
  ) => Promise<boolean>;
  
  // State management
  setSelectedTransaction: (transaction: Transaction | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create transactions store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTransactionsStore = create<TransactionsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        transactions: [],
        selectedTransaction: null,
        transactionDetails: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all transactions
         * @returns Success status
         */
        fetchTransactions: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetTransactions();
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch transactions'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch a single transaction by ID
         * @param id Transaction ID
         * @returns Success status
         */
        fetchTransaction: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetTransaction(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedTransaction = response.data || null;
                state.transactionDetails = response.data as TransactionWithDetails || null;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch transactions by stakeholder ID
         * @param stakeholderId Stakeholder ID
         * @returns Success status
         */
        fetchTransactionsByStakeholder: async (stakeholderId) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetTransactionsByStakeholder(stakeholderId);
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch transactions for stakeholder'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch transactions by security ID
         * @param securityId Security ID
         * @returns Success status
         */
        fetchTransactionsBySecurity: async (securityId) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetTransactionsBySecurity(securityId);
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch transactions for security'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch transactions by round ID
         * @param roundId Round ID
         * @returns Success status
         */
        fetchTransactionsByRound: async (roundId) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetTransactionsByRound(roundId);
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch transactions for round'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a new transaction
         * @param data Transaction data
         * @returns Success status
         */
        createTransaction: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateTransaction(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = [...state.transactions, response.data!];
                state.selectedTransaction = response.data;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Update an existing transaction
         * @param id Transaction ID
         * @param data Updated transaction data
         * @returns Success status
         */
        updateTransaction: async (id, data) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiUpdateTransaction(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                state.transactions = state.transactions.map(transaction => 
                  transaction.id === id ? response.data! : transaction
                );
                
                if (state.selectedTransaction?.id === id) {
                  state.selectedTransaction = response.data;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Delete a transaction
         * @param id Transaction ID
         * @returns Success status
         */
        deleteTransaction: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiDeleteTransaction(id);
            
            if (response.success) {
              set((state) => {
                state.transactions = state.transactions.filter(transaction => transaction.id !== id);
                
                if (state.selectedTransaction?.id === id) {
                  state.selectedTransaction = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create an investment transaction (TRANSFER_OUT from fund, TRANSFER_IN to investor, CASH_IN to fund)
         */
        createInvestmentTransaction: async (
          fundId,
          investorStakeholderId,
          securityId,
          roundId,
          units,
          amount,
          transactionDate,
          notes
        ) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateInvestmentTransaction(
              fundId,
              investorStakeholderId,
              securityId,
              roundId,
              units,
              amount,
              transactionDate,
              notes
            );
            
            if (response.success && response.data) {
              // Refresh transactions list after creating investment transaction
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create investment transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a security transfer (TRANSFER_OUT from sender, TRANSFER_IN to receiver)
         */
        createSecurityTransfer: async (
          fromStakeholderId,
          toStakeholderId,
          securityId,
          fundId,
          roundId,
          units,
          transactionDate,
          notes
        ) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiCreateSecurityTransfer(
              fromStakeholderId,
              toStakeholderId,
              securityId,
              fundId,
              roundId,
              units,
              transactionDate,
              notes
            );
            
            if (response.success && response.data) {
              // Refresh transactions list after creating security transfer
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create security transfer'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a distribution transaction (DISTRIBUTION)
         * Entity Perspective: Fund pays cash to stakeholder (amountCredit)
         */
        createDividendTransaction: async (
          fundId,
          stakeholderId,
          securityId,
          roundId,
          amount,
          transactionDate,
          notes
        ) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateDividendTransaction(
              fundId,
              stakeholderId,
              securityId,
              roundId,
              amount,
              transactionDate,
              notes
            );
            
            if (response.success && response.data) {
              // Refresh transactions list after creating dividend transaction
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create dividend transaction'
              });
              return false;
            }
          } catch (error: unknown) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Set the selected transaction
         * @param transaction Transaction to select or null to clear selection
         */
        setSelectedTransaction: (transaction) => {
          set((state) => {
            state.selectedTransaction = transaction;
          });
        },
        
        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset store to initial state
         */
        reset: () => {
          set({
            transactions: [],
            selectedTransaction: null,
            transactionDetails: null,
            isLoading: false,
            error: null
          });
        }
      })),
      {
        name: 'v7capital-transactions-storage',
        // Persist nothing to prevent stale data when transactions are added via scripts
        partialize: () => ({})
      }
    )
  )
);
