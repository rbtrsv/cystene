'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  FinancialMetrics,
  CreateFinancialMetrics,
  UpdateFinancialMetrics,
} from '../../schemas/financial/financial-metrics.schemas';
import {
  getFinancialMetricsList,
  getFinancialMetrics,
  createFinancialMetrics as apiCreateFinancialMetrics,
  updateFinancialMetrics as apiUpdateFinancialMetrics,
  deleteFinancialMetrics as apiDeleteFinancialMetrics,
  ListFinancialMetricsParams,
} from '../../service/financial/financial-metrics.service';

/**
 * FinancialMetrics store state interface
 */
export interface FinancialMetricsState {
  // State
  financialMetrics: FinancialMetrics[];
  activeFinancialMetricsId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchFinancialMetricsList: (params?: ListFinancialMetricsParams) => Promise<boolean>;
  fetchFinancialMetrics: (id: number) => Promise<FinancialMetrics | null>;
  createFinancialMetrics: (data: CreateFinancialMetrics) => Promise<boolean>;
  updateFinancialMetrics: (id: number, data: UpdateFinancialMetrics) => Promise<boolean>;
  deleteFinancialMetrics: (id: number) => Promise<boolean>;
  setActiveFinancialMetrics: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create financial metrics store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFinancialMetricsStore = create<FinancialMetricsState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      financialMetrics: [],
      activeFinancialMetricsId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize financial metrics state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFinancialMetricsList();

          if (response.success && response.data) {
            set((state) => {
              state.financialMetrics = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active financial metrics if not already set and financial metrics exist
              if (response.data && response.data.length > 0 && state.activeFinancialMetricsId === null) {
                state.activeFinancialMetricsId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize financial metrics'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize financial metrics'
          });
        }
      },

      /**
       * Fetch all financial metrics with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchFinancialMetricsList: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFinancialMetricsList(params);

          if (response.success && response.data) {
            set((state) => {
              state.financialMetrics = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch financial metrics'
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
       * Fetch a specific financial metrics by ID
       * @param id FinancialMetrics ID
       * @returns Promise with financial metrics or null
       */
      fetchFinancialMetrics: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFinancialMetrics(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch financial metrics with ID ${id}`
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
       * Create a new financial metrics
       * @param data FinancialMetrics creation data
       * @returns Success status
       */
      createFinancialMetrics: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateFinancialMetrics(data);

          if (response.success && response.data) {
            // After creating, refresh financial metrics list
            await get().fetchFinancialMetricsList();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create financial metrics'
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
       * Update an existing financial metrics
       * @param id FinancialMetrics ID
       * @param data FinancialMetrics update data
       * @returns Success status
       */
      updateFinancialMetrics: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateFinancialMetrics(id, data);

          if (response.success && response.data) {
            // After updating, refresh financial metrics list
            await get().fetchFinancialMetricsList();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update financial metrics with ID ${id}`
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
       * Delete a financial metrics
       * @param id FinancialMetrics ID
       * @returns Success status
       */
      deleteFinancialMetrics: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteFinancialMetrics(id);

          if (response.success) {
            // After deleting, refresh financial metrics list
            await get().fetchFinancialMetricsList();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete financial metrics with ID ${id}`
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
       * Set active financial metrics
       * @param id ID of the active financial metrics or null
       */
      setActiveFinancialMetrics: (id) => {
        set((state) => {
          state.activeFinancialMetricsId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset financial metrics state to initial values
       */
      reset: () => {
        set({
          financialMetrics: [],
          activeFinancialMetricsId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-financial-metrics-storage',
        partialize: (state) => ({
          activeFinancialMetricsId: state.activeFinancialMetricsId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get financial metrics by ID from store
 * @param id FinancialMetrics ID
 * @returns The financial metrics or undefined if not found
 */
export const getFinancialMetricsById = (id: number): FinancialMetrics | undefined => {
  const { financialMetrics } = useFinancialMetricsStore.getState();
  return financialMetrics.find((metrics) => metrics.id === id);
};

/**
 * Get active financial metrics from financial metrics store
 * @returns The active financial metrics or undefined if not set
 */
export const getActiveFinancialMetrics = (): FinancialMetrics | undefined => {
  const { financialMetrics, activeFinancialMetricsId } = useFinancialMetricsStore.getState();
  return financialMetrics.find((metrics) => metrics.id === activeFinancialMetricsId);
};
