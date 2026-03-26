'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Bioactivity,
  CreateBioactivity,
  UpdateBioactivity,
} from '@/modules/nexotype/schemas/knowledge_graph/bioactivity.schemas';
import {
  getBioactivities,
  getBioactivity,
  createBioactivity as apiCreateBioactivity,
  updateBioactivity as apiUpdateBioactivity,
  deleteBioactivity as apiDeleteBioactivity,
  ListBioactivitiesParams,
} from '@/modules/nexotype/service/knowledge_graph/bioactivity.service';

/**
 * Bioactivity store state interface
 */
export interface BioactivityState {
  // State
  bioactivities: Bioactivity[];
  activeBioactivityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBioactivities: (params?: ListBioactivitiesParams) => Promise<boolean>;
  fetchBioactivity: (id: number) => Promise<Bioactivity | null>;
  createBioactivity: (data: CreateBioactivity) => Promise<boolean>;
  updateBioactivity: (id: number, data: UpdateBioactivity) => Promise<boolean>;
  deleteBioactivity: (id: number) => Promise<boolean>;
  setActiveBioactivity: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create bioactivity store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBioactivityStore = create<BioactivityState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        bioactivities: [],
        activeBioactivityId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize bioactivities state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBioactivities();

            if (response.success && response.data) {
              set((state) => {
                state.bioactivities = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize bioactivities',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize bioactivities',
            });
          }
        },

        /**
         * Fetch all bioactivities with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchBioactivities: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBioactivities(params);

            if (response.success && response.data) {
              set((state) => {
                state.bioactivities = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch bioactivities',
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
         * Fetch a specific bioactivity by ID
         * @param id Bioactivity ID
         * @returns Promise with bioactivity or null
         */
        fetchBioactivity: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBioactivity(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch bioactivity with ID ${id}`,
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
         * Create a new bioactivity
         * @param data Bioactivity creation data
         * @returns Success status
         */
        createBioactivity: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateBioactivity(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchBioactivities();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create bioactivity',
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
         * Update an existing bioactivity
         * @param id Bioactivity ID
         * @param data Bioactivity update data
         * @returns Success status
         */
        updateBioactivity: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateBioactivity(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchBioactivities();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update bioactivity with ID ${id}`,
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
         * Delete a bioactivity
         * @param id Bioactivity ID
         * @returns Success status
         */
        deleteBioactivity: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteBioactivity(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchBioactivities();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete bioactivity with ID ${id}`,
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
         * Set active bioactivity
         * @param id ID of the active bioactivity or null
         */
        setActiveBioactivity: (id) => {
          set((state) => {
            state.activeBioactivityId = id;
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
            bioactivities: [],
            activeBioactivityId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-bioactivity-storage',
        partialize: (state) => ({
          activeBioactivityId: state.activeBioactivityId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get bioactivity by ID from store
 * @param id Bioactivity ID
 * @returns The bioactivity or undefined if not found
 */
export const getBioactivityById = (id: number): Bioactivity | undefined => {
  const { bioactivities } = useBioactivityStore.getState();
  return bioactivities.find((ba) => ba.id === id);
};

/**
 * Get active bioactivity from store
 * @returns The active bioactivity or undefined if not set
 */
export const getActiveBioactivity = (): Bioactivity | undefined => {
  const { bioactivities, activeBioactivityId } = useBioactivityStore.getState();
  return bioactivities.find((ba) => ba.id === activeBioactivityId);
};
