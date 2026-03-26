'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Holding,
  CreateHolding,
  UpdateHolding,
} from '../../schemas/holding/holding.schemas';
import {
  getHoldings,
  getHolding,
  createHolding as apiCreateHolding,
  updateHolding as apiUpdateHolding,
  deleteHolding as apiDeleteHolding,
  ListHoldingsParams,
} from '../../service/holding/holding.service';

/**
 * Holding store state interface
 */
export interface HoldingState {
  // State
  holdings: Holding[];
  activeHoldingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchHoldings: (params?: ListHoldingsParams) => Promise<boolean>;
  fetchHolding: (id: number) => Promise<Holding | null>;
  createHolding: (data: CreateHolding) => Promise<boolean>;
  updateHolding: (id: number, data: UpdateHolding) => Promise<boolean>;
  deleteHolding: (id: number) => Promise<boolean>;
  setActiveHolding: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create holding store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useHoldingStore = create<HoldingState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      holdings: [],
      activeHoldingId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize holdings state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldings();

          if (response.success && response.data) {
            set((state) => {
              state.holdings = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active holding if not already set and holdings exist
              if (response.data && response.data.length > 0 && state.activeHoldingId === null) {
                state.activeHoldingId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize holdings'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize holdings'
          });
        }
      },

      /**
       * Fetch all holdings with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchHoldings: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldings(params);

          if (response.success && response.data) {
            set((state) => {
              state.holdings = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch holdings'
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
       * Fetch a specific holding by ID
       * @param id Holding ID
       * @returns Promise with holding or null
       */
      fetchHolding: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHolding(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch holding with ID ${id}`
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
       * Create a new holding
       * @param data Holding creation data
       * @returns Success status
       */
      createHolding: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateHolding(data);

          if (response.success && response.data) {
            // After creating, refresh holdings list
            await get().fetchHoldings();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create holding'
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
       * Update an existing holding
       * @param id Holding ID
       * @param data Holding update data
       * @returns Success status
       */
      updateHolding: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateHolding(id, data);

          if (response.success && response.data) {
            // After updating, refresh holdings list
            await get().fetchHoldings();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update holding with ID ${id}`
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
       * Delete a holding
       * @param id Holding ID
       * @returns Success status
       */
      deleteHolding: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteHolding(id);

          if (response.success) {
            // After deleting, refresh holdings list
            await get().fetchHoldings();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete holding with ID ${id}`
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
       * Set active holding
       * @param id ID of the active holding or null
       */
      setActiveHolding: (id) => {
        set((state) => {
          state.activeHoldingId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset holding state to initial values
       */
      reset: () => {
        set({
          holdings: [],
          activeHoldingId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-holding-storage',
        partialize: (state) => ({
          activeHoldingId: state.activeHoldingId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get holding by ID from store
 * @param id Holding ID
 * @returns The holding or undefined if not found
 */
export const getHoldingById = (id: number): Holding | undefined => {
  const { holdings } = useHoldingStore.getState();
  return holdings.find((holding) => holding.id === id);
};

/**
 * Get active holding from holding store
 * @returns The active holding or undefined if not set
 */
export const getActiveHolding = (): Holding | undefined => {
  const { holdings, activeHoldingId } = useHoldingStore.getState();
  return holdings.find((holding) => holding.id === activeHoldingId);
};
