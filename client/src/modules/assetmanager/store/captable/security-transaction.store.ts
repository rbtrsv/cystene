'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SecurityTransaction,
  CreateSecurityTransaction,
  UpdateSecurityTransaction,
} from '../../schemas/captable/security-transaction.schemas';
import {
  getSecurityTransactions,
  getSecurityTransaction,
  createSecurityTransaction as apiCreateSecurityTransaction,
  updateSecurityTransaction as apiUpdateSecurityTransaction,
  deleteSecurityTransaction as apiDeleteSecurityTransaction,
  ListSecurityTransactionsParams
} from '../../service/captable/security-transaction.service';

/**
 * Security transaction store state interface
 */
export interface SecurityTransactionState {
  // State
  transactions: SecurityTransaction[];
  activeTransactionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSecurityTransactions: (params?: ListSecurityTransactionsParams) => Promise<boolean>;
  fetchSecurityTransaction: (id: number) => Promise<SecurityTransaction | null>;
  createSecurityTransaction: (data: CreateSecurityTransaction) => Promise<boolean>;
  updateSecurityTransaction: (id: number, data: UpdateSecurityTransaction) => Promise<boolean>;
  deleteSecurityTransaction: (id: number) => Promise<boolean>;
  setActiveTransaction: (transactionId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create security transaction store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSecurityTransactionStore = create<SecurityTransactionState>()(
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
       * Initialize security transactions state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurityTransactions();

          if (response.success && response.data) {
            set((state) => {
              state.transactions = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active transaction if not already set and transactions exist
              if (response.data && response.data.length > 0 && state.activeTransactionId === null) {
                state.activeTransactionId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize security transactions'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize security transactions'
          });
        }
      },

      /**
       * Fetch all security transactions with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchSecurityTransactions: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurityTransactions(params);

          if (response.success && response.data) {
            set((state) => {
              state.transactions = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch security transactions'
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
       * Fetch a specific security transaction by ID
       * @param id Security transaction ID
       * @returns Promise with security transaction or null
       */
      fetchSecurityTransaction: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSecurityTransaction(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch security transaction with ID ${id}`
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
       * Create a new security transaction
       * @param data Security transaction creation data
       * @returns Success status
       */
      createSecurityTransaction: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSecurityTransaction(data);

          if (response.success && response.data) {
            // After creating, refresh transactions list
            await get().fetchSecurityTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create security transaction'
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
       * Update an existing security transaction
       * @param id Security transaction ID
       * @param data Security transaction update data
       * @returns Success status
       */
      updateSecurityTransaction: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSecurityTransaction(id, data);

          if (response.success && response.data) {
            // After updating, refresh transactions list
            await get().fetchSecurityTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update security transaction with ID ${id}`
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
       * Delete a security transaction
       * @param id Security transaction ID
       * @returns Success status
       */
      deleteSecurityTransaction: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSecurityTransaction(id);

          if (response.success) {
            // After deleting, refresh transactions list
            await get().fetchSecurityTransactions();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete security transaction with ID ${id}`
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
       * Set active transaction
       * @param transactionId ID of the active transaction or null
       */
      setActiveTransaction: (transactionId) => {
        set((state) => {
          state.activeTransactionId = transactionId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset security transaction state to initial values
       */
      reset: () => {
        set({
          transactions: [],
          activeTransactionId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-security-transaction-storage',
        partialize: (state) => ({
          activeTransactionId: state.activeTransactionId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get security transaction by ID from store
 * @param id Security transaction ID
 * @returns The security transaction or undefined if not found
 */
export const getSecurityTransactionById = (id: number): SecurityTransaction | undefined => {
  const { transactions } = useSecurityTransactionStore.getState();
  return transactions.find((transaction) => transaction.id === id);
};

/**
 * Get active security transaction from store
 * @returns The active security transaction or undefined if not set
 */
export const getActiveSecurityTransaction = (): SecurityTransaction | undefined => {
  const { transactions, activeTransactionId } = useSecurityTransactionStore.getState();
  return transactions.find((transaction) => transaction.id === activeTransactionId);
};
