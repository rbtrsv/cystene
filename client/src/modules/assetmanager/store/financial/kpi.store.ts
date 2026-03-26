'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  KPI,
  CreateKPI,
  UpdateKPI,
} from '../../schemas/financial/kpi.schemas';
import {
  getKPIs,
  getKPI,
  createKPI as apiCreateKPI,
  updateKPI as apiUpdateKPI,
  deleteKPI as apiDeleteKPI,
  ListKPIsParams,
} from '../../service/financial/kpi.service';

/**
 * KPI store state interface
 */
export interface KPIState {
  // State
  kpis: KPI[];
  activeKPIId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchKPIs: (params?: ListKPIsParams) => Promise<boolean>;
  fetchKPI: (id: number) => Promise<KPI | null>;
  createKPI: (data: CreateKPI) => Promise<boolean>;
  updateKPI: (id: number, data: UpdateKPI) => Promise<boolean>;
  deleteKPI: (id: number) => Promise<boolean>;
  setActiveKPI: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create KPI store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useKPIStore = create<KPIState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      kpis: [],
      activeKPIId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize KPIs state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPIs();

          if (response.success && response.data) {
            set((state) => {
              state.kpis = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active KPI if not already set and KPIs exist
              if (response.data && response.data.length > 0 && state.activeKPIId === null) {
                state.activeKPIId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize kpis'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize kpis'
          });
        }
      },

      /**
       * Fetch all KPIs with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchKPIs: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPIs(params);

          if (response.success && response.data) {
            set((state) => {
              state.kpis = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch kpis'
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
       * Fetch a specific KPI by ID
       * @param id KPI ID
       * @returns Promise with KPI or null
       */
      fetchKPI: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getKPI(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch kpi with ID ${id}`
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
       * Create a new KPI
       * @param data KPI creation data
       * @returns Success status
       */
      createKPI: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateKPI(data);

          if (response.success && response.data) {
            // After creating, refresh KPIs list
            await get().fetchKPIs();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create kpi'
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
       * Update an existing KPI
       * @param id KPI ID
       * @param data KPI update data
       * @returns Success status
       */
      updateKPI: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateKPI(id, data);

          if (response.success && response.data) {
            // After updating, refresh KPIs list
            await get().fetchKPIs();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update kpi with ID ${id}`
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
       * Delete a KPI
       * @param id KPI ID
       * @returns Success status
       */
      deleteKPI: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteKPI(id);

          if (response.success) {
            // After deleting, refresh KPIs list
            await get().fetchKPIs();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete kpi with ID ${id}`
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
       * Set active KPI
       * @param id ID of the active KPI or null
       */
      setActiveKPI: (id) => {
        set((state) => {
          state.activeKPIId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset KPI state to initial values
       */
      reset: () => {
        set({
          kpis: [],
          activeKPIId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-kpi-storage',
        partialize: (state) => ({
          activeKPIId: state.activeKPIId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get KPI by ID from store
 * @param id KPI ID
 * @returns The KPI or undefined if not found
 */
export const getKPIById = (id: number): KPI | undefined => {
  const { kpis } = useKPIStore.getState();
  return kpis.find((kpi) => kpi.id === id);
};

/**
 * Get active KPI from KPI store
 * @returns The active KPI or undefined if not set
 */
export const getActiveKPI = (): KPI | undefined => {
  const { kpis, activeKPIId } = useKPIStore.getState();
  return kpis.find((kpi) => kpi.id === activeKPIId);
};
