'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssayRun,
  CreateAssayRun,
  UpdateAssayRun,
} from '@/modules/nexotype/schemas/lims/assay-run.schemas';
import {
  getAssayRuns,
  getAssayRun,
  createAssayRun as apiCreateAssayRun,
  updateAssayRun as apiUpdateAssayRun,
  deleteAssayRun as apiDeleteAssayRun,
  ListAssayRunsParams,
} from '@/modules/nexotype/service/lims/assay-run.service';

/**
 * Assay run store state interface
 */
export interface AssayRunState {
  // State
  assayRuns: AssayRun[];
  activeAssayRunId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssayRuns: (params?: ListAssayRunsParams) => Promise<boolean>;
  fetchAssayRun: (id: number) => Promise<AssayRun | null>;
  createAssayRun: (data: CreateAssayRun) => Promise<boolean>;
  updateAssayRun: (id: number, data: UpdateAssayRun) => Promise<boolean>;
  deleteAssayRun: (id: number) => Promise<boolean>;
  setActiveAssayRun: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create assay run store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssayRunStore = create<AssayRunState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        assayRuns: [],
        activeAssayRunId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize assay runs state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayRuns();

            if (response.success && response.data) {
              set((state) => {
                state.assayRuns = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize assay runs',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize assay runs',
            });
          }
        },

        /**
         * Fetch all assay runs with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchAssayRuns: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayRuns(params);

            if (response.success && response.data) {
              set((state) => {
                state.assayRuns = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch assay runs',
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
         * Fetch a specific assay run by ID
         * @param id AssayRun ID
         * @returns Promise with assay run or null
         */
        fetchAssayRun: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayRun(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch assay run with ID ${id}`,
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
         * Create a new assay run
         * @param data AssayRun creation data
         * @returns Success status
         */
        createAssayRun: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateAssayRun(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchAssayRuns();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create assay run',
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
         * Update an existing assay run
         * @param id AssayRun ID
         * @param data AssayRun update data
         * @returns Success status
         */
        updateAssayRun: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateAssayRun(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchAssayRuns();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update assay run with ID ${id}`,
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
         * Delete an assay run
         * @param id AssayRun ID
         * @returns Success status
         */
        deleteAssayRun: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteAssayRun(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchAssayRuns();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete assay run with ID ${id}`,
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
         * Set active assay run
         * @param id ID of the active assay run or null
         */
        setActiveAssayRun: (id) => {
          set((state) => {
            state.activeAssayRunId = id;
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
            assayRuns: [],
            activeAssayRunId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-assay-run-storage',
        partialize: (state) => ({
          activeAssayRunId: state.activeAssayRunId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get assay run by ID from store
 * @param id AssayRun ID
 * @returns The assay run or undefined if not found
 */
export const getAssayRunById = (id: number): AssayRun | undefined => {
  const { assayRuns } = useAssayRunStore.getState();
  return assayRuns.find((ar) => ar.id === id);
};

/**
 * Get active assay run from store
 * @returns The active assay run or undefined if not set
 */
export const getActiveAssayRun = (): AssayRun | undefined => {
  const { assayRuns, activeAssayRunId } = useAssayRunStore.getState();
  return assayRuns.find((ar) => ar.id === activeAssayRunId);
};
