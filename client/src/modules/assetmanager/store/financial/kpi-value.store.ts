'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  KPIValue,
  CreateKPIValue,
  UpdateKPIValue,
} from '../../schemas/financial/kpi-value.schemas';
import {
  getKPIValues,
  getKPIValue,
  createKPIValue as apiCreateKPIValue,
  updateKPIValue as apiUpdateKPIValue,
  deleteKPIValue as apiDeleteKPIValue,
  ListKPIValuesParams,
} from '../../service/financial/kpi-value.service';

/**
 * KPIValue store state interface
 */
export interface KPIValueState {
  // State
  kpiValues: KPIValue[];
  activeKPIValueId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchKPIValues: (params?: ListKPIValuesParams) => Promise<boolean>;
  fetchKPIValue: (id: number) => Promise<KPIValue | null>;
  createKPIValue: (data: CreateKPIValue) => Promise<boolean>;
  updateKPIValue: (id: number, data: UpdateKPIValue) => Promise<boolean>;
  deleteKPIValue: (id: number) => Promise<boolean>;
  setActiveKPIValue: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create KPI value store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useKPIValueStore = create<KPIValueState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      kpiValues: [],
      activeKPIValueId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize KPI values state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPIValues();

          if (response.success && response.data) {
            set((state) => {
              state.kpiValues = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active KPI value if not already set and KPI values exist
              if (response.data && response.data.length > 0 && state.activeKPIValueId === null) {
                state.activeKPIValueId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize kpi values'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize kpi values'
          });
        }
      },

      /**
       * Fetch all KPI values with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchKPIValues: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPIValues(params);

          if (response.success && response.data) {
            set((state) => {
              state.kpiValues = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch kpi values'
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
       * Fetch a specific KPI value by ID
       * @param id KPIValue ID
       * @returns Promise with KPI value or null
       */
      fetchKPIValue: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPIValue(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch kpi value with ID ${id}`
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
       * Create a new KPI value
       * @param data KPIValue creation data
       * @returns Success status
       */
      createKPIValue: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateKPIValue(data);

          if (response.success && response.data) {
            // After creating, refresh KPI values list
            await get().fetchKPIValues();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create kpi value'
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
       * Update an existing KPI value
       * @param id KPIValue ID
       * @param data KPIValue update data
       * @returns Success status
       */
      updateKPIValue: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateKPIValue(id, data);

          if (response.success && response.data) {
            // After updating, refresh KPI values list
            await get().fetchKPIValues();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update kpi value with ID ${id}`
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
       * Delete a KPI value
       * @param id KPIValue ID
       * @returns Success status
       */
      deleteKPIValue: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteKPIValue(id);

          if (response.success) {
            // After deleting, refresh KPI values list
            await get().fetchKPIValues();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete kpi value with ID ${id}`
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
       * Set active KPI value
       * @param id ID of the active KPI value or null
       */
      setActiveKPIValue: (id) => {
        set((state) => {
          state.activeKPIValueId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset KPI value state to initial values
       */
      reset: () => {
        set({
          kpiValues: [],
          activeKPIValueId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-kpi-value-storage',
        partialize: (state) => ({
          activeKPIValueId: state.activeKPIValueId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get KPI value by ID from store
 * @param id KPIValue ID
 * @returns The KPI value or undefined if not found
 */
export const getKPIValueById = (id: number): KPIValue | undefined => {
  const { kpiValues } = useKPIValueStore.getState();
  return kpiValues.find((kpiValue) => kpiValue.id === id);
};

/**
 * Get active KPI value from KPI value store
 * @returns The active KPI value or undefined if not set
 */
export const getActiveKPIValue = (): KPIValue | undefined => {
  const { kpiValues, activeKPIValueId } = useKPIValueStore.getState();
  return kpiValues.find((kpiValue) => kpiValue.id === activeKPIValueId);
};
