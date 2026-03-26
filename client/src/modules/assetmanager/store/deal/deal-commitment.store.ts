'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DealCommitment,
  CreateDealCommitment,
  UpdateDealCommitment,
} from '../../schemas/deal/deal-commitment.schemas';
import {
  getDealCommitments,
  getDealCommitment,
  createDealCommitment as apiCreateDealCommitment,
  updateDealCommitment as apiUpdateDealCommitment,
  deleteDealCommitment as apiDeleteDealCommitment,
  ListDealCommitmentsParams,
} from '../../service/deal/deal-commitment.service';

/**
 * DealCommitment store state interface
 */
export interface DealCommitmentState {
  // State
  dealCommitments: DealCommitment[];
  activeDealCommitmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDealCommitments: (params?: ListDealCommitmentsParams) => Promise<boolean>;
  fetchDealCommitment: (id: number) => Promise<DealCommitment | null>;
  createDealCommitment: (data: CreateDealCommitment) => Promise<boolean>;
  updateDealCommitment: (id: number, data: UpdateDealCommitment) => Promise<boolean>;
  deleteDealCommitment: (id: number) => Promise<boolean>;
  setActiveDealCommitment: (commitmentId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create deal commitment store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDealCommitmentStore = create<DealCommitmentState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      dealCommitments: [],
      activeDealCommitmentId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize deal commitments state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealCommitments();

          if (response.success && response.data) {
            set((state) => {
              state.dealCommitments = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active deal commitment if not already set and deal commitments exist
              if (response.data && response.data.length > 0 && state.activeDealCommitmentId === null) {
                state.activeDealCommitmentId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize deal commitments'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize deal commitments'
          });
        }
      },

      /**
       * Fetch all deal commitments with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchDealCommitments: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealCommitments(params);

          if (response.success && response.data) {
            set((state) => {
              state.dealCommitments = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch deal commitments'
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
       * Fetch a specific deal commitment by ID
       * @param id DealCommitment ID
       * @returns Promise with deal commitment or null
       */
      fetchDealCommitment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealCommitment(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch deal commitment with ID ${id}`
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
       * Create a new deal commitment
       * @param data DealCommitment creation data
       * @returns Success status
       */
      createDealCommitment: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateDealCommitment(data);

          if (response.success && response.data) {
            // After creating, refresh deal commitments list
            await get().fetchDealCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create deal commitment'
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
       * Update an existing deal commitment
       * @param id DealCommitment ID
       * @param data DealCommitment update data
       * @returns Success status
       */
      updateDealCommitment: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateDealCommitment(id, data);

          if (response.success && response.data) {
            // After updating, refresh deal commitments list
            await get().fetchDealCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update deal commitment with ID ${id}`
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
       * Delete a deal commitment
       * @param id DealCommitment ID
       * @returns Success status
       */
      deleteDealCommitment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteDealCommitment(id);

          if (response.success) {
            // After deleting, refresh deal commitments list
            await get().fetchDealCommitments();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete deal commitment with ID ${id}`
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
       * Set active deal commitment
       * @param commitmentId ID of the active deal commitment or null
       */
      setActiveDealCommitment: (commitmentId) => {
        set((state) => {
          state.activeDealCommitmentId = commitmentId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset deal commitment state to initial values
       */
      reset: () => {
        set({
          dealCommitments: [],
          activeDealCommitmentId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-deal-commitment-storage',
        partialize: (state) => ({
          activeDealCommitmentId: state.activeDealCommitmentId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get deal commitment by ID from store
 * @param id DealCommitment ID
 * @returns The deal commitment or undefined if not found
 */
export const getDealCommitmentById = (id: number): DealCommitment | undefined => {
  const { dealCommitments } = useDealCommitmentStore.getState();
  return dealCommitments.find((commitment) => commitment.id === id);
};

/**
 * Get active deal commitment from deal commitment store
 * @returns The active deal commitment or undefined if not set
 */
export const getActiveDealCommitment = (): DealCommitment | undefined => {
  const { dealCommitments, activeDealCommitmentId } = useDealCommitmentStore.getState();
  return dealCommitments.find((commitment) => commitment.id === activeDealCommitmentId);
};
