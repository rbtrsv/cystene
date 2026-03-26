'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Transaction,
  CreateTransaction,
  UpdateTransaction,
} from '@/modules/nexotype/schemas/commercial/transaction.schemas';
import {
  getTransactions,
  getTransaction,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  ListTransactionsParams,
} from '@/modules/nexotype/service/commercial/transaction.service';

/**
 * Transaction store state interface
 */
export interface TransactionState {
  // State
  transactions: Transaction[];
  activeTransactionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTransactions: (params?: ListTransactionsParams) => Promise<boolean>;
  fetchTransaction: (id: number) => Promise<Transaction | null>;
  createTransaction: (data: CreateTransaction) => Promise<boolean>;
  updateTransaction: (id: number, data: UpdateTransaction) => Promise<boolean>;
  deleteTransaction: (id: number) => Promise<boolean>;
  setActiveTransaction: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create transaction store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTransactionStore = create<TransactionState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        transactions: [],
        activeTransactionId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize transactions state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTransactions();

            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize transactions',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize transactions',
            });
          }
        },

        /**
         * Fetch all transactions with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchTransactions: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTransactions(params);

            if (response.success && response.data) {
              set((state) => {
                state.transactions = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch transactions',
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Fetch a specific transaction by ID
         * @param id Transaction ID
         * @returns Promise with transaction or null
         */
        fetchTransaction: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTransaction(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch transaction with ID ${id}`,
            });
            return null;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return null;
          }
        },

        /**
         * Create a new transaction
         * @param data Transaction creation data
         * @returns Success status
         */
        createTransaction: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateTransaction(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create transaction',
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Update an existing transaction
         * @param id Transaction ID
         * @param data Transaction update data
         * @returns Success status
         */
        updateTransaction: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateTransaction(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update transaction with ID ${id}`,
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
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
              // After deleting, refresh list
              await get().fetchTransactions();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete transaction with ID ${id}`,
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Set active transaction
         * @param id ID of the active transaction or null
         */
        setActiveTransaction: (id) => {
          set((state) => {
            state.activeTransactionId = id;
          });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset state to initial values
         */
        reset: () => {
          set({
            transactions: [],
            activeTransactionId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-transaction-storage',
        partialize: (state) => ({
          activeTransactionId: state.activeTransactionId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get transaction by ID from store
 * @param id Transaction ID
 * @returns The transaction or undefined if not found
 */
export const getTransactionById = (id: number): Transaction | undefined => {
  const { transactions } = useTransactionStore.getState();
  return transactions.find((tx) => tx.id === id);
};

/**
 * Get active transaction from store
 * @returns The active transaction or undefined if not set
 */
export const getActiveTransaction = (): Transaction | undefined => {
  const { transactions, activeTransactionId } = useTransactionStore.getState();
  return transactions.find((tx) => tx.id === activeTransactionId);
};
