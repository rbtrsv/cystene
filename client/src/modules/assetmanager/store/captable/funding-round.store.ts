'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  FundingRound,
  CreateFundingRound,
  UpdateFundingRound,
} from '../../schemas/captable/funding-round.schemas';
import {
  getFundingRounds,
  getFundingRound,
  createFundingRound as apiCreateFundingRound,
  updateFundingRound as apiUpdateFundingRound,
  deleteFundingRound as apiDeleteFundingRound,
  ListFundingRoundsParams
} from '../../service/captable/funding-round.service';

/**
 * FundingRound store state interface
 */
export interface FundingRoundState {
  // State
  fundingRounds: FundingRound[];
  activeFundingRoundId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchFundingRounds: (params?: ListFundingRoundsParams) => Promise<boolean>;
  fetchFundingRound: (id: number) => Promise<FundingRound | null>;
  createFundingRound: (data: CreateFundingRound) => Promise<boolean>;
  updateFundingRound: (id: number, data: UpdateFundingRound) => Promise<boolean>;
  deleteFundingRound: (id: number) => Promise<boolean>;
  setActiveFundingRound: (fundingRoundId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create funding round store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFundingRoundStore = create<FundingRoundState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      fundingRounds: [],
      activeFundingRoundId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize funding rounds state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFundingRounds();

          if (response.success && response.data) {
            set((state) => {
              state.fundingRounds = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active funding round if not already set and funding rounds exist
              if (response.data && response.data.length > 0 && state.activeFundingRoundId === null) {
                state.activeFundingRoundId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize funding rounds'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize funding rounds'
          });
        }
      },

      /**
       * Fetch all funding rounds with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchFundingRounds: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFundingRounds(params);

          if (response.success && response.data) {
            set((state) => {
              state.fundingRounds = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch funding rounds'
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
       * Fetch a specific funding round by ID
       * @param id FundingRound ID
       * @returns Promise with funding round or null
       */
      fetchFundingRound: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFundingRound(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch funding round with ID ${id}`
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
       * Create a new funding round
       * @param data FundingRound creation data
       * @returns Success status
       */
      createFundingRound: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateFundingRound(data);

          if (response.success && response.data) {
            // After creating, refresh funding rounds list
            await get().fetchFundingRounds();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create funding round'
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
       * Update an existing funding round
       * @param id FundingRound ID
       * @param data FundingRound update data
       * @returns Success status
       */
      updateFundingRound: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateFundingRound(id, data);

          if (response.success && response.data) {
            // After updating, refresh funding rounds list
            await get().fetchFundingRounds();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update funding round with ID ${id}`
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
       * Delete a funding round
       * @param id FundingRound ID
       * @returns Success status
       */
      deleteFundingRound: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteFundingRound(id);

          if (response.success) {
            // After deleting, refresh funding rounds list
            await get().fetchFundingRounds();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete funding round with ID ${id}`
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
       * Set active funding round
       * @param fundingRoundId ID of the active funding round or null
       */
      setActiveFundingRound: (fundingRoundId) => {
        set((state) => {
          state.activeFundingRoundId = fundingRoundId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset funding round state to initial values
       */
      reset: () => {
        set({
          fundingRounds: [],
          activeFundingRoundId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-funding-round-storage',
        partialize: (state) => ({
          activeFundingRoundId: state.activeFundingRoundId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get funding round by ID from store
 * @param id FundingRound ID
 * @returns The funding round or undefined if not found
 */
export const getFundingRoundById = (id: number): FundingRound | undefined => {
  const { fundingRounds } = useFundingRoundStore.getState();
  return fundingRounds.find((round) => round.id === id);
};

/**
 * Get active funding round from store
 * @returns The active funding round or undefined if not set
 */
export const getActiveFundingRound = (): FundingRound | undefined => {
  const { fundingRounds, activeFundingRoundId } = useFundingRoundStore.getState();
  return fundingRounds.find((round) => round.id === activeFundingRoundId);
};
