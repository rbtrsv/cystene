'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SyndicateTransaction,
  CreateSyndicateTransaction,
  UpdateSyndicateTransaction,
} from '../../schemas/entity/syndicate-transaction.schemas';
import {
  getSyndicateTransactions,
  getSyndicateTransaction,
  createSyndicateTransaction as apiCreateSyndicateTransaction,
  updateSyndicateTransaction as apiUpdateSyndicateTransaction,
  deleteSyndicateTransaction as apiDeleteSyndicateTransaction,
  ListSyndicateTransactionsParams
} from '../../service/entity/syndicate-transaction.service';

/**
 * Syndicate Transactions store state interface
 */
export interface SyndicateTransactionsState {
  // State
  transactions: SyndicateTransaction[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListSyndicateTransactionsParams) => Promise<void>;
  fetchTransactions: (params?: ListSyndicateTransactionsParams) => Promise<boolean>;
  fetchTransaction: (id: number) => Promise<SyndicateTransaction | null>;
  createTransaction: (data: CreateSyndicateTransaction) => Promise<boolean>;
  updateTransaction: (id: number, data: UpdateSyndicateTransaction) => Promise<boolean>;
  deleteTransaction: (id: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create syndicate transactions store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSyndicateTransactionsStore = create<SyndicateTransactionsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      transactions: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize syndicate transactions state
       */
      initialize: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateTransactions(params);

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
              error: response.error || 'Failed to initialize syndicate transactions'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize syndicate transactions'
          });
        }
      },

      /**
       * Fetch all syndicate transactions with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchTransactions: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateTransactions(params);

          if (response.success && response.data) {
            set((state) => {
              state.transactions = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch syndicate transactions'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Fetch a specific syndicate transaction by ID
       * @param id Syndicate transaction ID
       * @returns Promise with transaction or null
       */
      fetchTransaction: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateTransaction(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch syndicate transaction with ID ${id}`
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },

      /**
       * Create a new syndicate transaction
       * @param data Syndicate transaction creation data
       * @returns Success status
       */
      createTransaction: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSyndicateTransaction(data);

          if (response.success && response.data) {
            // After creating, refresh transactions list
            await get().fetchTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create syndicate transaction'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Update an existing syndicate transaction
       * @param id Syndicate transaction ID
       * @param data Syndicate transaction update data
       * @returns Success status
       */
      updateTransaction: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSyndicateTransaction(id, data);

          if (response.success && response.data) {
            // After updating, refresh transactions list
            await get().fetchTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update syndicate transaction with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Delete a syndicate transaction
       * @param id Syndicate transaction ID
       * @returns Success status
       */
      deleteTransaction: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSyndicateTransaction(id);

          if (response.success) {
            // After deleting, refresh transactions list
            await get().fetchTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete syndicate transaction with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
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
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
    {
      name: 'finpy-syndicate-transactions-store'
    }
  )
);

/**
 * Helper function to get syndicate transaction by ID from store
 * @param id Syndicate transaction ID
 * @returns The transaction or undefined if not found
 */
export const getSyndicateTransactionById = (id: number): SyndicateTransaction | undefined => {
  const { transactions } = useSyndicateTransactionsStore.getState();
  return transactions.find((transaction) => transaction.id === id);
};
