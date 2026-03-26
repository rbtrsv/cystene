'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  BalanceSheet,
  CreateBalanceSheet,
  UpdateBalanceSheet,
} from '../../schemas/financial/balance-sheet.schemas';
import {
  getBalanceSheets,
  getBalanceSheet,
  createBalanceSheet as apiCreateBalanceSheet,
  updateBalanceSheet as apiUpdateBalanceSheet,
  deleteBalanceSheet as apiDeleteBalanceSheet,
  ListBalanceSheetsParams,
} from '../../service/financial/balance-sheet.service';

/**
 * BalanceSheet store state interface
 */
export interface BalanceSheetState {
  // State
  balanceSheets: BalanceSheet[];
  activeBalanceSheetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBalanceSheets: (params?: ListBalanceSheetsParams) => Promise<boolean>;
  fetchBalanceSheet: (id: number) => Promise<BalanceSheet | null>;
  createBalanceSheet: (data: CreateBalanceSheet) => Promise<boolean>;
  updateBalanceSheet: (id: number, data: UpdateBalanceSheet) => Promise<boolean>;
  deleteBalanceSheet: (id: number) => Promise<boolean>;
  setActiveBalanceSheet: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create balance sheet store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBalanceSheetStore = create<BalanceSheetState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      balanceSheets: [],
      activeBalanceSheetId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize balance sheets state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBalanceSheets();

          if (response.success && response.data) {
            set((state) => {
              state.balanceSheets = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active balance sheet if not already set and balance sheets exist
              if (response.data && response.data.length > 0 && state.activeBalanceSheetId === null) {
                state.activeBalanceSheetId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize balance sheets'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize balance sheets'
          });
        }
      },

      /**
       * Fetch all balance sheets with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchBalanceSheets: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBalanceSheets(params);

          if (response.success && response.data) {
            set((state) => {
              state.balanceSheets = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch balance sheets'
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
       * Fetch a specific balance sheet by ID
       * @param id BalanceSheet ID
       * @returns Promise with balance sheet or null
       */
      fetchBalanceSheet: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBalanceSheet(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch balance sheet with ID ${id}`
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
       * Create a new balance sheet
       * @param data BalanceSheet creation data
       * @returns Success status
       */
      createBalanceSheet: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateBalanceSheet(data);

          if (response.success && response.data) {
            // After creating, refresh balance sheets list
            await get().fetchBalanceSheets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create balance sheet'
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
       * Update an existing balance sheet
       * @param id BalanceSheet ID
       * @param data BalanceSheet update data
       * @returns Success status
       */
      updateBalanceSheet: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateBalanceSheet(id, data);

          if (response.success && response.data) {
            // After updating, refresh balance sheets list
            await get().fetchBalanceSheets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update balance sheet with ID ${id}`
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
       * Delete a balance sheet
       * @param id BalanceSheet ID
       * @returns Success status
       */
      deleteBalanceSheet: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteBalanceSheet(id);

          if (response.success) {
            // After deleting, refresh balance sheets list
            await get().fetchBalanceSheets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete balance sheet with ID ${id}`
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
       * Set active balance sheet
       * @param id ID of the active balance sheet or null
       */
      setActiveBalanceSheet: (id) => {
        set((state) => {
          state.activeBalanceSheetId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset balance sheet state to initial values
       */
      reset: () => {
        set({
          balanceSheets: [],
          activeBalanceSheetId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-balance-sheet-storage',
        partialize: (state) => ({
          activeBalanceSheetId: state.activeBalanceSheetId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get balance sheet by ID from store
 * @param id BalanceSheet ID
 * @returns The balance sheet or undefined if not found
 */
export const getBalanceSheetById = (id: number): BalanceSheet | undefined => {
  const { balanceSheets } = useBalanceSheetStore.getState();
  return balanceSheets.find((balanceSheet) => balanceSheet.id === id);
};

/**
 * Get active balance sheet from balance sheet store
 * @returns The active balance sheet or undefined if not set
 */
export const getActiveBalanceSheet = (): BalanceSheet | undefined => {
  const { balanceSheets, activeBalanceSheetId } = useBalanceSheetStore.getState();
  return balanceSheets.find((balanceSheet) => balanceSheet.id === activeBalanceSheetId);
};
