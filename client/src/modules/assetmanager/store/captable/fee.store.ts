'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Fee,
  CreateFee,
  UpdateFee,
} from '../../schemas/captable/fee.schemas';
import {
  getFees,
  getFee,
  createFee as apiCreateFee,
  updateFee as apiUpdateFee,
  deleteFee as apiDeleteFee,
  ListFeesParams
} from '../../service/captable/fee.service';

/**
 * Fee store state interface
 */
export interface FeeState {
  // State
  fees: Fee[];
  activeFeeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchFees: (params?: ListFeesParams) => Promise<boolean>;
  fetchFee: (id: number) => Promise<Fee | null>;
  createFee: (data: CreateFee) => Promise<boolean>;
  updateFee: (id: number, data: UpdateFee) => Promise<boolean>;
  deleteFee: (id: number) => Promise<boolean>;
  setActiveFee: (feeId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create fee store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFeeStore = create<FeeState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      fees: [],
      activeFeeId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize fees state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFees();

          if (response.success && response.data) {
            set((state) => {
              state.fees = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active fee if not already set and fees exist
              if (response.data && response.data.length > 0 && state.activeFeeId === null) {
                state.activeFeeId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize fees'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize fees'
          });
        }
      },

      /**
       * Fetch all fees with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchFees: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFees(params);

          if (response.success && response.data) {
            set((state) => {
              state.fees = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch fees'
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
       * Fetch a specific fee by ID
       * @param id Fee ID
       * @returns Promise with fee or null
       */
      fetchFee: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFee(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch fee with ID ${id}`
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
       * Create a new fee
       * @param data Fee creation data
       * @returns Success status
       */
      createFee: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateFee(data);

          if (response.success && response.data) {
            // After creating, refresh fees list
            await get().fetchFees();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create fee'
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
       * Update an existing fee
       * @param id Fee ID
       * @param data Fee update data
       * @returns Success status
       */
      updateFee: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateFee(id, data);

          if (response.success && response.data) {
            // After updating, refresh fees list
            await get().fetchFees();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update fee with ID ${id}`
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
       * Delete a fee
       * @param id Fee ID
       * @returns Success status
       */
      deleteFee: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteFee(id);

          if (response.success) {
            // After deleting, refresh fees list
            await get().fetchFees();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete fee with ID ${id}`
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
       * Set active fee
       * @param feeId ID of the active fee or null
       */
      setActiveFee: (feeId) => {
        set((state) => {
          state.activeFeeId = feeId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset fee state to initial values
       */
      reset: () => {
        set({
          fees: [],
          activeFeeId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-fee-storage',
        partialize: (state) => ({
          activeFeeId: state.activeFeeId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get fee by ID from store
 * @param id Fee ID
 * @returns The fee or undefined if not found
 */
export const getFeeById = (id: number): Fee | undefined => {
  const { fees } = useFeeStore.getState();
  return fees.find((fee) => fee.id === id);
};

/**
 * Get active fee from store
 * @returns The active fee or undefined if not set
 */
export const getActiveFee = (): Fee | undefined => {
  const { fees, activeFeeId } = useFeeStore.getState();
  return fees.find((fee) => fee.id === activeFeeId);
};
