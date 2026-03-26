'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DealPipeline,
  CreateDealPipeline,
  UpdateDealPipeline,
} from '../../schemas/holding/deal-pipeline.schemas';
import {
  getDealPipelines,
  getDealPipeline,
  createDealPipeline as apiCreateDealPipeline,
  updateDealPipeline as apiUpdateDealPipeline,
  deleteDealPipeline as apiDeleteDealPipeline,
  ListDealPipelinesParams,
} from '../../service/holding/deal-pipeline.service';

/**
 * Deal Pipeline store state interface
 */
export interface DealPipelineState {
  // State
  dealPipelines: DealPipeline[];
  activeDealPipelineId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDealPipelines: (params?: ListDealPipelinesParams) => Promise<boolean>;
  fetchDealPipeline: (id: number) => Promise<DealPipeline | null>;
  createDealPipeline: (data: CreateDealPipeline) => Promise<boolean>;
  updateDealPipeline: (id: number, data: UpdateDealPipeline) => Promise<boolean>;
  deleteDealPipeline: (id: number) => Promise<boolean>;
  setActiveDealPipeline: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create deal pipeline store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDealPipelineStore = create<DealPipelineState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      dealPipelines: [],
      activeDealPipelineId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize deal pipelines state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealPipelines();

          if (response.success && response.data) {
            set((state) => {
              state.dealPipelines = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active deal pipeline if not already set and deal pipelines exist
              if (response.data && response.data.length > 0 && state.activeDealPipelineId === null) {
                state.activeDealPipelineId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize deal pipeline entries'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize deal pipeline entries'
          });
        }
      },

      /**
       * Fetch all deal pipelines with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchDealPipelines: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealPipelines(params);

          if (response.success && response.data) {
            set((state) => {
              state.dealPipelines = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch deal pipeline entries'
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
       * Fetch a specific deal pipeline by ID
       * @param id DealPipeline ID
       * @returns Promise with deal pipeline or null
       */
      fetchDealPipeline: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getDealPipeline(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch deal pipeline entry with ID ${id}`
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
       * Create a new deal pipeline
       * @param data DealPipeline creation data
       * @returns Success status
       */
      createDealPipeline: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateDealPipeline(data);

          if (response.success && response.data) {
            // After creating, refresh deal pipelines list
            await get().fetchDealPipelines();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create deal pipeline entry'
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
       * Update an existing deal pipeline
       * @param id DealPipeline ID
       * @param data DealPipeline update data
       * @returns Success status
       */
      updateDealPipeline: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateDealPipeline(id, data);

          if (response.success && response.data) {
            // After updating, refresh deal pipelines list
            await get().fetchDealPipelines();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update deal pipeline entry with ID ${id}`
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
       * Delete a deal pipeline
       * @param id DealPipeline ID
       * @returns Success status
       */
      deleteDealPipeline: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteDealPipeline(id);

          if (response.success) {
            // After deleting, refresh deal pipelines list
            await get().fetchDealPipelines();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete deal pipeline entry with ID ${id}`
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
       * Set active deal pipeline
       * @param id ID of the active deal pipeline or null
       */
      setActiveDealPipeline: (id) => {
        set((state) => {
          state.activeDealPipelineId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset deal pipeline state to initial values
       */
      reset: () => {
        set({
          dealPipelines: [],
          activeDealPipelineId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-deal-pipeline-storage',
        partialize: (state) => ({
          activeDealPipelineId: state.activeDealPipelineId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get deal pipeline by ID from store
 * @param id DealPipeline ID
 * @returns The deal pipeline or undefined if not found
 */
export const getDealPipelineById = (id: number): DealPipeline | undefined => {
  const { dealPipelines } = useDealPipelineStore.getState();
  return dealPipelines.find((pipeline) => pipeline.id === id);
};

/**
 * Get active deal pipeline from deal pipeline store
 * @returns The active deal pipeline or undefined if not set
 */
export const getActiveDealPipeline = (): DealPipeline | undefined => {
  const { dealPipelines, activeDealPipelineId } = useDealPipelineStore.getState();
  return dealPipelines.find((pipeline) => pipeline.id === activeDealPipelineId);
};
