'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Deal,
  CreateDeal,
  UpdateDeal,
} from '../../schemas/deal/deal.schemas';
import {
  getDeals,
  getDeal,
  createDeal as apiCreateDeal,
  updateDeal as apiUpdateDeal,
  deleteDeal as apiDeleteDeal,
  ListDealsParams,
} from '../../service/deal/deal.service';

/**
 * Deal store state interface
 */
export interface DealState {
  // State
  deals: Deal[];
  activeDealId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDeals: (params?: ListDealsParams) => Promise<boolean>;
  fetchDeal: (id: number) => Promise<Deal | null>;
  createDeal: (data: CreateDeal) => Promise<boolean>;
  updateDeal: (id: number, data: UpdateDeal) => Promise<boolean>;
  deleteDeal: (id: number) => Promise<boolean>;
  setActiveDeal: (dealId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create deal store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDealStore = create<DealState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      deals: [],
      activeDealId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize deals state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDeals();

          if (response.success && response.data) {
            set((state) => {
              state.deals = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active deal if not already set and deals exist
              if (response.data && response.data.length > 0 && state.activeDealId === null) {
                state.activeDealId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize deals'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize deals'
          });
        }
      },

      /**
       * Fetch all deals with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchDeals: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDeals(params);

          if (response.success && response.data) {
            set((state) => {
              state.deals = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch deals'
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
       * Fetch a specific deal by ID
       * @param id Deal ID
       * @returns Promise with deal or null
       */
      fetchDeal: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDeal(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch deal with ID ${id}`
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
       * Create a new deal
       * @param data Deal creation data
       * @returns Success status
       */
      createDeal: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateDeal(data);

          if (response.success && response.data) {
            // After creating, refresh deals list
            await get().fetchDeals();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create deal'
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
       * Update an existing deal
       * @param id Deal ID
       * @param data Deal update data
       * @returns Success status
       */
      updateDeal: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateDeal(id, data);

          if (response.success && response.data) {
            // After updating, refresh deals list
            await get().fetchDeals();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update deal with ID ${id}`
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
       * Delete a deal
       * @param id Deal ID
       * @returns Success status
       */
      deleteDeal: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteDeal(id);

          if (response.success) {
            // After deleting, refresh deals list
            await get().fetchDeals();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete deal with ID ${id}`
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
       * Set active deal
       * @param dealId ID of the active deal or null
       */
      setActiveDeal: (dealId) => {
        set((state) => {
          state.activeDealId = dealId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset deal state to initial values
       */
      reset: () => {
        set({
          deals: [],
          activeDealId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-deal-storage',
        partialize: (state) => ({
          activeDealId: state.activeDealId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get deal by ID from store
 * @param id Deal ID
 * @returns The deal or undefined if not found
 */
export const getDealById = (id: number): Deal | undefined => {
  const { deals } = useDealStore.getState();
  return deals.find((deal) => deal.id === id);
};

/**
 * Get active deal from deal store
 * @returns The active deal or undefined if not set
 */
export const getActiveDeal = (): Deal | undefined => {
  const { deals, activeDealId } = useDealStore.getState();
  return deals.find((deal) => deal.id === activeDealId);
};
