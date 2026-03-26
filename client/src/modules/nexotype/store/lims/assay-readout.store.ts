'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssayReadout,
  CreateAssayReadout,
  UpdateAssayReadout,
} from '@/modules/nexotype/schemas/lims/assay-readout.schemas';
import {
  getAssayReadouts,
  getAssayReadout,
  createAssayReadout as apiCreateAssayReadout,
  updateAssayReadout as apiUpdateAssayReadout,
  deleteAssayReadout as apiDeleteAssayReadout,
  ListAssayReadoutsParams,
} from '@/modules/nexotype/service/lims/assay-readout.service';

/**
 * Assay readout store state interface
 */
export interface AssayReadoutState {
  // State
  assayReadouts: AssayReadout[];
  activeAssayReadoutId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssayReadouts: (params?: ListAssayReadoutsParams) => Promise<boolean>;
  fetchAssayReadout: (id: number) => Promise<AssayReadout | null>;
  createAssayReadout: (data: CreateAssayReadout) => Promise<boolean>;
  updateAssayReadout: (id: number, data: UpdateAssayReadout) => Promise<boolean>;
  deleteAssayReadout: (id: number) => Promise<boolean>;
  setActiveAssayReadout: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create assay readout store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssayReadoutStore = create<AssayReadoutState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        assayReadouts: [],
        activeAssayReadoutId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize assay readouts state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayReadouts();

            if (response.success && response.data) {
              set((state) => {
                state.assayReadouts = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize assay readouts',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize assay readouts',
            });
          }
        },

        /**
         * Fetch all assay readouts with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchAssayReadouts: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayReadouts(params);

            if (response.success && response.data) {
              set((state) => {
                state.assayReadouts = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch assay readouts',
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
         * Fetch a specific assay readout by ID
         * @param id AssayReadout ID
         * @returns Promise with assay readout or null
         */
        fetchAssayReadout: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssayReadout(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch assay readout with ID ${id}`,
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
         * Create a new assay readout
         * @param data AssayReadout creation data
         * @returns Success status
         */
        createAssayReadout: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateAssayReadout(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchAssayReadouts();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create assay readout',
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
         * Update an existing assay readout
         * @param id AssayReadout ID
         * @param data AssayReadout update data
         * @returns Success status
         */
        updateAssayReadout: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateAssayReadout(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchAssayReadouts();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update assay readout with ID ${id}`,
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
         * Delete an assay readout
         * @param id AssayReadout ID
         * @returns Success status
         */
        deleteAssayReadout: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteAssayReadout(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchAssayReadouts();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete assay readout with ID ${id}`,
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
         * Set active assay readout
         * @param id ID of the active assay readout or null
         */
        setActiveAssayReadout: (id) => {
          set((state) => {
            state.activeAssayReadoutId = id;
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
            assayReadouts: [],
            activeAssayReadoutId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-assay-readout-storage',
        partialize: (state) => ({
          activeAssayReadoutId: state.activeAssayReadoutId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get assay readout by ID from store
 * @param id AssayReadout ID
 * @returns The assay readout or undefined if not found
 */
export const getAssayReadoutById = (id: number): AssayReadout | undefined => {
  const { assayReadouts } = useAssayReadoutStore.getState();
  return assayReadouts.find((ar) => ar.id === id);
};

/**
 * Get active assay readout from store
 * @returns The active assay readout or undefined if not set
 */
export const getActiveAssayReadout = (): AssayReadout | undefined => {
  const { assayReadouts, activeAssayReadoutId } = useAssayReadoutStore.getState();
  return assayReadouts.find((ar) => ar.id === activeAssayReadoutId);
};
