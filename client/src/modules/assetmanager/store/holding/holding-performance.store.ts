'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  HoldingPerformance,
  CreateHoldingPerformance,
  UpdateHoldingPerformance,
} from '../../schemas/holding/holding-performance.schemas';
import {
  getHoldingPerformances,
  getHoldingPerformance,
  createHoldingPerformance as apiCreateHoldingPerformance,
  updateHoldingPerformance as apiUpdateHoldingPerformance,
  deleteHoldingPerformance as apiDeleteHoldingPerformance,
  ListHoldingPerformancesParams,
} from '../../service/holding/holding-performance.service';

/**
 * Holding Performance store state interface
 */
export interface HoldingPerformanceState {
  // State
  holdingPerformances: HoldingPerformance[];
  activeHoldingPerformanceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchHoldingPerformances: (params?: ListHoldingPerformancesParams) => Promise<boolean>;
  fetchHoldingPerformance: (id: number) => Promise<HoldingPerformance | null>;
  createHoldingPerformance: (data: CreateHoldingPerformance) => Promise<boolean>;
  updateHoldingPerformance: (id: number, data: UpdateHoldingPerformance) => Promise<boolean>;
  deleteHoldingPerformance: (id: number) => Promise<boolean>;
  setActiveHoldingPerformance: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create holding performance store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useHoldingPerformanceStore = create<HoldingPerformanceState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      holdingPerformances: [],
      activeHoldingPerformanceId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize holding performances state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingPerformances();

          if (response.success && response.data) {
            set((state) => {
              state.holdingPerformances = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active holding performance if not already set and holding performances exist
              if (response.data && response.data.length > 0 && state.activeHoldingPerformanceId === null) {
                state.activeHoldingPerformanceId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize holding performance records'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize holding performance records'
          });
        }
      },

      /**
       * Fetch all holding performances with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchHoldingPerformances: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingPerformances(params);

          if (response.success && response.data) {
            set((state) => {
              state.holdingPerformances = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch holding performance records'
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
       * Fetch a specific holding performance by ID
       * @param id HoldingPerformance ID
       * @returns Promise with holding performance or null
       */
      fetchHoldingPerformance: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingPerformance(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch holding performance record with ID ${id}`
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
       * Create a new holding performance
       * @param data HoldingPerformance creation data
       * @returns Success status
       */
      createHoldingPerformance: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateHoldingPerformance(data);

          if (response.success && response.data) {
            // After creating, refresh holding performances list
            await get().fetchHoldingPerformances();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create holding performance record'
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
       * Update an existing holding performance
       * @param id HoldingPerformance ID
       * @param data HoldingPerformance update data
       * @returns Success status
       */
      updateHoldingPerformance: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateHoldingPerformance(id, data);

          if (response.success && response.data) {
            // After updating, refresh holding performances list
            await get().fetchHoldingPerformances();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update holding performance record with ID ${id}`
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
       * Delete a holding performance
       * @param id HoldingPerformance ID
       * @returns Success status
       */
      deleteHoldingPerformance: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteHoldingPerformance(id);

          if (response.success) {
            // After deleting, refresh holding performances list
            await get().fetchHoldingPerformances();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete holding performance record with ID ${id}`
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
       * Set active holding performance
       * @param id ID of the active holding performance or null
       */
      setActiveHoldingPerformance: (id) => {
        set((state) => {
          state.activeHoldingPerformanceId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset holding performance state to initial values
       */
      reset: () => {
        set({
          holdingPerformances: [],
          activeHoldingPerformanceId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-holding-performance-storage',
        partialize: (state) => ({
          activeHoldingPerformanceId: state.activeHoldingPerformanceId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get holding performance by ID from store
 * @param id HoldingPerformance ID
 * @returns The holding performance or undefined if not found
 */
export const getHoldingPerformanceById = (id: number): HoldingPerformance | undefined => {
  const { holdingPerformances } = useHoldingPerformanceStore.getState();
  return holdingPerformances.find((performance) => performance.id === id);
};

/**
 * Get active holding performance from holding performance store
 * @returns The active holding performance or undefined if not set
 */
export const getActiveHoldingPerformance = (): HoldingPerformance | undefined => {
  const { holdingPerformances, activeHoldingPerformanceId } = useHoldingPerformanceStore.getState();
  return holdingPerformances.find((performance) => performance.id === activeHoldingPerformanceId);
};
