'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  CashFlowStatement,
  CreateCashFlowStatement,
  UpdateCashFlowStatement,
} from '../../schemas/financial/cash-flow-statement.schemas';
import {
  getCashFlowStatements,
  getCashFlowStatement,
  createCashFlowStatement as apiCreateCashFlowStatement,
  updateCashFlowStatement as apiUpdateCashFlowStatement,
  deleteCashFlowStatement as apiDeleteCashFlowStatement,
  ListCashFlowStatementsParams,
} from '../../service/financial/cash-flow-statement.service';

/**
 * CashFlowStatement store state interface
 */
export interface CashFlowStatementState {
  // State
  cashFlowStatements: CashFlowStatement[];
  activeCashFlowStatementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchCashFlowStatements: (params?: ListCashFlowStatementsParams) => Promise<boolean>;
  fetchCashFlowStatement: (id: number) => Promise<CashFlowStatement | null>;
  createCashFlowStatement: (data: CreateCashFlowStatement) => Promise<boolean>;
  updateCashFlowStatement: (id: number, data: UpdateCashFlowStatement) => Promise<boolean>;
  deleteCashFlowStatement: (id: number) => Promise<boolean>;
  setActiveCashFlowStatement: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create cash flow statement store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCashFlowStatementStore = create<CashFlowStatementState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      cashFlowStatements: [],
      activeCashFlowStatementId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize cash flow statements state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCashFlowStatements();

          if (response.success && response.data) {
            set((state) => {
              state.cashFlowStatements = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active cash flow statement if not already set and cash flow statements exist
              if (response.data && response.data.length > 0 && state.activeCashFlowStatementId === null) {
                state.activeCashFlowStatementId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize cash flow statements'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize cash flow statements'
          });
        }
      },

      /**
       * Fetch all cash flow statements with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchCashFlowStatements: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCashFlowStatements(params);

          if (response.success && response.data) {
            set((state) => {
              state.cashFlowStatements = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch cash flow statements'
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
       * Fetch a specific cash flow statement by ID
       * @param id CashFlowStatement ID
       * @returns Promise with cash flow statement or null
       */
      fetchCashFlowStatement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getCashFlowStatement(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch cash flow statement with ID ${id}`
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
       * Create a new cash flow statement
       * @param data CashFlowStatement creation data
       * @returns Success status
       */
      createCashFlowStatement: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateCashFlowStatement(data);

          if (response.success && response.data) {
            // After creating, refresh cash flow statements list
            await get().fetchCashFlowStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create cash flow statement'
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
       * Update an existing cash flow statement
       * @param id CashFlowStatement ID
       * @param data CashFlowStatement update data
       * @returns Success status
       */
      updateCashFlowStatement: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateCashFlowStatement(id, data);

          if (response.success && response.data) {
            // After updating, refresh cash flow statements list
            await get().fetchCashFlowStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update cash flow statement with ID ${id}`
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
       * Delete a cash flow statement
       * @param id CashFlowStatement ID
       * @returns Success status
       */
      deleteCashFlowStatement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteCashFlowStatement(id);

          if (response.success) {
            // After deleting, refresh cash flow statements list
            await get().fetchCashFlowStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete cash flow statement with ID ${id}`
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
       * Set active cash flow statement
       * @param id ID of the active cash flow statement or null
       */
      setActiveCashFlowStatement: (id) => {
        set((state) => {
          state.activeCashFlowStatementId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset cash flow statement state to initial values
       */
      reset: () => {
        set({
          cashFlowStatements: [],
          activeCashFlowStatementId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-cash-flow-statement-storage',
        partialize: (state) => ({
          activeCashFlowStatementId: state.activeCashFlowStatementId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get cash flow statement by ID from store
 * @param id CashFlowStatement ID
 * @returns The cash flow statement or undefined if not found
 */
export const getCashFlowStatementById = (id: number): CashFlowStatement | undefined => {
  const { cashFlowStatements } = useCashFlowStatementStore.getState();
  return cashFlowStatements.find((statement) => statement.id === id);
};

/**
 * Get active cash flow statement from cash flow statement store
 * @returns The active cash flow statement or undefined if not set
 */
export const getActiveCashFlowStatement = (): CashFlowStatement | undefined => {
  const { cashFlowStatements, activeCashFlowStatementId } = useCashFlowStatementStore.getState();
  return cashFlowStatements.find((statement) => statement.id === activeCashFlowStatementId);
};
