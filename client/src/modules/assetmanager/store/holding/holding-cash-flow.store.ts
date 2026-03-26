'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  HoldingCashFlow,
  CreateHoldingCashFlow,
  UpdateHoldingCashFlow,
} from '../../schemas/holding/holding-cash-flow.schemas';
import {
  getHoldingCashFlows,
  getHoldingCashFlow,
  createHoldingCashFlow as apiCreateHoldingCashFlow,
  updateHoldingCashFlow as apiUpdateHoldingCashFlow,
  deleteHoldingCashFlow as apiDeleteHoldingCashFlow,
  ListHoldingCashFlowsParams,
} from '../../service/holding/holding-cash-flow.service';

/**
 * Holding Cash Flow store state interface
 */
export interface HoldingCashFlowState {
  // State
  holdingCashFlows: HoldingCashFlow[];
  activeHoldingCashFlowId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchHoldingCashFlows: (params?: ListHoldingCashFlowsParams) => Promise<boolean>;
  fetchHoldingCashFlow: (id: number) => Promise<HoldingCashFlow | null>;
  createHoldingCashFlow: (data: CreateHoldingCashFlow) => Promise<boolean>;
  updateHoldingCashFlow: (id: number, data: UpdateHoldingCashFlow) => Promise<boolean>;
  deleteHoldingCashFlow: (id: number) => Promise<boolean>;
  setActiveHoldingCashFlow: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create holding cash flow store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useHoldingCashFlowStore = create<HoldingCashFlowState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      holdingCashFlows: [],
      activeHoldingCashFlowId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize holding cash flows state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingCashFlows();

          if (response.success && response.data) {
            set((state) => {
              state.holdingCashFlows = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active holding cash flow if not already set and holding cash flows exist
              if (response.data && response.data.length > 0 && state.activeHoldingCashFlowId === null) {
                state.activeHoldingCashFlowId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize holding cash flows'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize holding cash flows'
          });
        }
      },

      /**
       * Fetch all holding cash flows with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchHoldingCashFlows: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingCashFlows(params);

          if (response.success && response.data) {
            set((state) => {
              state.holdingCashFlows = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch holding cash flows'
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
       * Fetch a specific holding cash flow by ID
       * @param id HoldingCashFlow ID
       * @returns Promise with holding cash flow or null
       */
      fetchHoldingCashFlow: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingCashFlow(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch holding cash flow with ID ${id}`
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
       * Create a new holding cash flow
       * @param data HoldingCashFlow creation data
       * @returns Success status
       */
      createHoldingCashFlow: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateHoldingCashFlow(data);

          if (response.success && response.data) {
            // After creating, refresh holding cash flows list
            await get().fetchHoldingCashFlows();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create holding cash flow'
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
       * Update an existing holding cash flow
       * @param id HoldingCashFlow ID
       * @param data HoldingCashFlow update data
       * @returns Success status
       */
      updateHoldingCashFlow: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateHoldingCashFlow(id, data);

          if (response.success && response.data) {
            // After updating, refresh holding cash flows list
            await get().fetchHoldingCashFlows();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update holding cash flow with ID ${id}`
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
       * Delete a holding cash flow
       * @param id HoldingCashFlow ID
       * @returns Success status
       */
      deleteHoldingCashFlow: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteHoldingCashFlow(id);

          if (response.success) {
            // After deleting, refresh holding cash flows list
            await get().fetchHoldingCashFlows();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete holding cash flow with ID ${id}`
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
       * Set active holding cash flow
       * @param id ID of the active holding cash flow or null
       */
      setActiveHoldingCashFlow: (id) => {
        set((state) => {
          state.activeHoldingCashFlowId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset holding cash flow state to initial values
       */
      reset: () => {
        set({
          holdingCashFlows: [],
          activeHoldingCashFlowId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-holding-cash-flow-storage',
        partialize: (state) => ({
          activeHoldingCashFlowId: state.activeHoldingCashFlowId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get holding cash flow by ID from store
 * @param id HoldingCashFlow ID
 * @returns The holding cash flow or undefined if not found
 */
export const getHoldingCashFlowById = (id: number): HoldingCashFlow | undefined => {
  const { holdingCashFlows } = useHoldingCashFlowStore.getState();
  return holdingCashFlows.find((cashFlow) => cashFlow.id === id);
};

/**
 * Get active holding cash flow from holding cash flow store
 * @returns The active holding cash flow or undefined if not set
 */
export const getActiveHoldingCashFlow = (): HoldingCashFlow | undefined => {
  const { holdingCashFlows, activeHoldingCashFlowId } = useHoldingCashFlowStore.getState();
  return holdingCashFlows.find((cashFlow) => cashFlow.id === activeHoldingCashFlowId);
};
