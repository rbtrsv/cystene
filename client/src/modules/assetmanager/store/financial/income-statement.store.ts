'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  IncomeStatement,
  CreateIncomeStatement,
  UpdateIncomeStatement,
} from '../../schemas/financial/income-statement.schemas';
import {
  getIncomeStatements,
  getIncomeStatement,
  createIncomeStatement as apiCreateIncomeStatement,
  updateIncomeStatement as apiUpdateIncomeStatement,
  deleteIncomeStatement as apiDeleteIncomeStatement,
  ListIncomeStatementsParams,
} from '../../service/financial/income-statement.service';

/**
 * IncomeStatement store state interface
 */
export interface IncomeStatementState {
  // State
  incomeStatements: IncomeStatement[];
  activeIncomeStatementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchIncomeStatements: (params?: ListIncomeStatementsParams) => Promise<boolean>;
  fetchIncomeStatement: (id: number) => Promise<IncomeStatement | null>;
  createIncomeStatement: (data: CreateIncomeStatement) => Promise<boolean>;
  updateIncomeStatement: (id: number, data: UpdateIncomeStatement) => Promise<boolean>;
  deleteIncomeStatement: (id: number) => Promise<boolean>;
  setActiveIncomeStatement: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create income statement store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useIncomeStatementStore = create<IncomeStatementState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      incomeStatements: [],
      activeIncomeStatementId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize income statements state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIncomeStatements();

          if (response.success && response.data) {
            set((state) => {
              state.incomeStatements = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active income statement if not already set and income statements exist
              if (response.data && response.data.length > 0 && state.activeIncomeStatementId === null) {
                state.activeIncomeStatementId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize income statements'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize income statements'
          });
        }
      },

      /**
       * Fetch all income statements with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchIncomeStatements: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIncomeStatements(params);

          if (response.success && response.data) {
            set((state) => {
              state.incomeStatements = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch income statements'
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
       * Fetch a specific income statement by ID
       * @param id IncomeStatement ID
       * @returns Promise with income statement or null
       */
      fetchIncomeStatement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIncomeStatement(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch income statement with ID ${id}`
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
       * Create a new income statement
       * @param data IncomeStatement creation data
       * @returns Success status
       */
      createIncomeStatement: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateIncomeStatement(data);

          if (response.success && response.data) {
            // After creating, refresh income statements list
            await get().fetchIncomeStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create income statement'
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
       * Update an existing income statement
       * @param id IncomeStatement ID
       * @param data IncomeStatement update data
       * @returns Success status
       */
      updateIncomeStatement: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateIncomeStatement(id, data);

          if (response.success && response.data) {
            // After updating, refresh income statements list
            await get().fetchIncomeStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update income statement with ID ${id}`
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
       * Delete an income statement
       * @param id IncomeStatement ID
       * @returns Success status
       */
      deleteIncomeStatement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteIncomeStatement(id);

          if (response.success) {
            // After deleting, refresh income statements list
            await get().fetchIncomeStatements();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete income statement with ID ${id}`
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
       * Set active income statement
       * @param id ID of the active income statement or null
       */
      setActiveIncomeStatement: (id) => {
        set((state) => {
          state.activeIncomeStatementId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset income statement state to initial values
       */
      reset: () => {
        set({
          incomeStatements: [],
          activeIncomeStatementId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-income-statement-storage',
        partialize: (state) => ({
          activeIncomeStatementId: state.activeIncomeStatementId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get income statement by ID from store
 * @param id IncomeStatement ID
 * @returns The income statement or undefined if not found
 */
export const getIncomeStatementById = (id: number): IncomeStatement | undefined => {
  const { incomeStatements } = useIncomeStatementStore.getState();
  return incomeStatements.find((statement) => statement.id === id);
};

/**
 * Get active income statement from income statement store
 * @returns The active income statement or undefined if not set
 */
export const getActiveIncomeStatement = (): IncomeStatement | undefined => {
  const { incomeStatements, activeIncomeStatementId } = useIncomeStatementStore.getState();
  return incomeStatements.find((statement) => statement.id === activeIncomeStatementId);
};
