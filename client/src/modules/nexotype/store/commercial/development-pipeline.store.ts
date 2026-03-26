'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DevelopmentPipeline,
  CreateDevelopmentPipeline,
  UpdateDevelopmentPipeline,
} from '@/modules/nexotype/schemas/commercial/development-pipeline.schemas';
import {
  getDevelopmentPipelines,
  getDevelopmentPipeline,
  createDevelopmentPipeline as apiCreateDevelopmentPipeline,
  updateDevelopmentPipeline as apiUpdateDevelopmentPipeline,
  deleteDevelopmentPipeline as apiDeleteDevelopmentPipeline,
  ListDevelopmentPipelinesParams,
} from '@/modules/nexotype/service/commercial/development-pipeline.service';

/**
 * DevelopmentPipeline store state interface
 */
export interface DevelopmentPipelineState {
  // State
  developmentPipelines: DevelopmentPipeline[];
  activeDevelopmentPipelineId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDevelopmentPipelines: (params?: ListDevelopmentPipelinesParams) => Promise<boolean>;
  fetchDevelopmentPipeline: (id: number) => Promise<DevelopmentPipeline | null>;
  createDevelopmentPipeline: (data: CreateDevelopmentPipeline) => Promise<boolean>;
  updateDevelopmentPipeline: (id: number, data: UpdateDevelopmentPipeline) => Promise<boolean>;
  deleteDevelopmentPipeline: (id: number) => Promise<boolean>;
  setActiveDevelopmentPipeline: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create development pipeline store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDevelopmentPipelineStore = create<DevelopmentPipelineState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        developmentPipelines: [],
        activeDevelopmentPipelineId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize development pipelines state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDevelopmentPipelines();

            if (response.success && response.data) {
              set((state) => {
                state.developmentPipelines = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize development pipelines',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize development pipelines',
            });
          }
        },

        /**
         * Fetch all development pipelines with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchDevelopmentPipelines: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDevelopmentPipelines(params);

            if (response.success && response.data) {
              set((state) => {
                state.developmentPipelines = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch development pipelines',
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Fetch a specific development pipeline by ID
         * @param id DevelopmentPipeline ID
         * @returns Promise with development pipeline or null
         */
        fetchDevelopmentPipeline: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDevelopmentPipeline(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch development pipeline with ID ${id}`,
            });
            return null;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return null;
          }
        },

        /**
         * Create a new development pipeline
         * @param data DevelopmentPipeline creation data
         * @returns Success status
         */
        createDevelopmentPipeline: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateDevelopmentPipeline(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchDevelopmentPipelines();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create development pipeline',
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Update an existing development pipeline
         * @param id DevelopmentPipeline ID
         * @param data DevelopmentPipeline update data
         * @returns Success status
         */
        updateDevelopmentPipeline: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateDevelopmentPipeline(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchDevelopmentPipelines();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update development pipeline with ID ${id}`,
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Delete a development pipeline
         * @param id DevelopmentPipeline ID
         * @returns Success status
         */
        deleteDevelopmentPipeline: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteDevelopmentPipeline(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchDevelopmentPipelines();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete development pipeline with ID ${id}`,
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Set active development pipeline
         * @param id ID of the active development pipeline or null
         */
        setActiveDevelopmentPipeline: (id) => {
          set((state) => {
            state.activeDevelopmentPipelineId = id;
          });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset state to initial values
         */
        reset: () => {
          set({
            developmentPipelines: [],
            activeDevelopmentPipelineId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-development-pipeline-storage',
        partialize: (state) => ({
          activeDevelopmentPipelineId: state.activeDevelopmentPipelineId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get development pipeline by ID from store
 * @param id DevelopmentPipeline ID
 * @returns The development pipeline or undefined if not found
 */
export const getDevelopmentPipelineById = (id: number): DevelopmentPipeline | undefined => {
  const { developmentPipelines } = useDevelopmentPipelineStore.getState();
  return developmentPipelines.find((dp) => dp.id === id);
};

/**
 * Get active development pipeline from store
 * @returns The active development pipeline or undefined if not set
 */
export const getActiveDevelopmentPipeline = (): DevelopmentPipeline | undefined => {
  const { developmentPipelines, activeDevelopmentPipelineId } = useDevelopmentPipelineStore.getState();
  return developmentPipelines.find((dp) => dp.id === activeDevelopmentPipelineId);
};
