'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Valuation,
  CreateValuation,
  UpdateValuation,
} from '../../schemas/holding/valuation.schemas';
import {
  getValuations,
  getValuation,
  createValuation as apiCreateValuation,
  updateValuation as apiUpdateValuation,
  deleteValuation as apiDeleteValuation,
  ListValuationsParams,
} from '../../service/holding/valuation.service';

/**
 * Valuation store state interface
 */
export interface ValuationState {
  // State
  valuations: Valuation[];
  activeValuationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchValuations: (params?: ListValuationsParams) => Promise<boolean>;
  fetchValuation: (id: number) => Promise<Valuation | null>;
  createValuation: (data: CreateValuation) => Promise<boolean>;
  updateValuation: (id: number, data: UpdateValuation) => Promise<boolean>;
  deleteValuation: (id: number) => Promise<boolean>;
  setActiveValuation: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create valuation store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useValuationStore = create<ValuationState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      valuations: [],
      activeValuationId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize valuations state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getValuations();

          if (response.success && response.data) {
            set((state) => {
              state.valuations = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active valuation if not already set and valuations exist
              if (response.data && response.data.length > 0 && state.activeValuationId === null) {
                state.activeValuationId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize valuations'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize valuations'
          });
        }
      },

      /**
       * Fetch all valuations with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchValuations: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getValuations(params);

          if (response.success && response.data) {
            set((state) => {
              state.valuations = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch valuations'
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
       * Fetch a specific valuation by ID
       * @param id Valuation ID
       * @returns Promise with valuation or null
       */
      fetchValuation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getValuation(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch valuation with ID ${id}`
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
       * Create a new valuation
       * @param data Valuation creation data
       * @returns Success status
       */
      createValuation: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateValuation(data);

          if (response.success && response.data) {
            // After creating, refresh valuations list
            await get().fetchValuations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create valuation'
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
       * Update an existing valuation
       * @param id Valuation ID
       * @param data Valuation update data
       * @returns Success status
       */
      updateValuation: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateValuation(id, data);

          if (response.success && response.data) {
            // After updating, refresh valuations list
            await get().fetchValuations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update valuation with ID ${id}`
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
       * Delete a valuation
       * @param id Valuation ID
       * @returns Success status
       */
      deleteValuation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteValuation(id);

          if (response.success) {
            // After deleting, refresh valuations list
            await get().fetchValuations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete valuation with ID ${id}`
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
       * Set active valuation
       * @param id ID of the active valuation or null
       */
      setActiveValuation: (id) => {
        set((state) => {
          state.activeValuationId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset valuation state to initial values
       */
      reset: () => {
        set({
          valuations: [],
          activeValuationId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-valuation-storage',
        partialize: (state) => ({
          activeValuationId: state.activeValuationId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get valuation by ID from store
 * @param id Valuation ID
 * @returns The valuation or undefined if not found
 */
export const getValuationById = (id: number): Valuation | undefined => {
  const { valuations } = useValuationStore.getState();
  return valuations.find((valuation) => valuation.id === id);
};

/**
 * Get active valuation from valuation store
 * @returns The active valuation or undefined if not set
 */
export const getActiveValuation = (): Valuation | undefined => {
  const { valuations, activeValuationId } = useValuationStore.getState();
  return valuations.find((valuation) => valuation.id === activeValuationId);
};
