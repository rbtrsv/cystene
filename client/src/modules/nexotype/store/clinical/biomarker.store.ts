'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Biomarker,
  CreateBiomarker,
  UpdateBiomarker,
} from '@/modules/nexotype/schemas/clinical/biomarker.schemas';
import {
  getBiomarkers,
  getBiomarker,
  createBiomarker as apiCreateBiomarker,
  updateBiomarker as apiUpdateBiomarker,
  deleteBiomarker as apiDeleteBiomarker,
  ListBiomarkersParams,
} from '@/modules/nexotype/service/clinical/biomarker.service';

/**
 * Biomarker store state interface
 */
export interface BiomarkerState {
  // State
  biomarkers: Biomarker[];
  activeBiomarkerId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBiomarkers: (params?: ListBiomarkersParams) => Promise<boolean>;
  fetchBiomarker: (id: number) => Promise<Biomarker | null>;
  createBiomarker: (data: CreateBiomarker) => Promise<boolean>;
  updateBiomarker: (id: number, data: UpdateBiomarker) => Promise<boolean>;
  deleteBiomarker: (id: number) => Promise<boolean>;
  setActiveBiomarker: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create biomarker store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBiomarkerStore = create<BiomarkerState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      biomarkers: [],
      activeBiomarkerId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize biomarkers state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBiomarkers();

          if (response.success && response.data) {
            set((state) => {
              state.biomarkers = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize biomarkers',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize biomarkers',
          });
        }
      },

      /**
       * Fetch all biomarkers with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchBiomarkers: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBiomarkers(params);

          if (response.success && response.data) {
            set((state) => {
              state.biomarkers = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch biomarkers',
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
       * Fetch a specific biomarker by ID
       * @param id Biomarker ID
       * @returns Promise with biomarker or null
       */
      fetchBiomarker: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getBiomarker(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch biomarker with ID ${id}`,
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
       * Create a new biomarker
       * @param data Biomarker creation data
       * @returns Success status
       */
      createBiomarker: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateBiomarker(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchBiomarkers();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create biomarker',
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
       * Update an existing biomarker
       * @param id Biomarker ID
       * @param data Biomarker update data
       * @returns Success status
       */
      updateBiomarker: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateBiomarker(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchBiomarkers();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update biomarker with ID ${id}`,
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
       * Delete a biomarker
       * @param id Biomarker ID
       * @returns Success status
       */
      deleteBiomarker: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteBiomarker(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchBiomarkers();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete biomarker with ID ${id}`,
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
       * Set active biomarker
       * @param id ID of the active biomarker or null
       */
      setActiveBiomarker: (id) => {
        set((state) => {
          state.activeBiomarkerId = id;
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
          biomarkers: [],
          activeBiomarkerId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-biomarker-storage',
        partialize: (state) => ({
          activeBiomarkerId: state.activeBiomarkerId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get biomarker by ID from store
 * @param id Biomarker ID
 * @returns The biomarker or undefined if not found
 */
export const getBiomarkerById = (id: number): Biomarker | undefined => {
  const { biomarkers } = useBiomarkerStore.getState();
  return biomarkers.find((bm) => bm.id === id);
};

/**
 * Get active biomarker from store
 * @returns The active biomarker or undefined if not set
 */
export const getActiveBiomarker = (): Biomarker | undefined => {
  const { biomarkers, activeBiomarkerId } = useBiomarkerStore.getState();
  return biomarkers.find((bm) => bm.id === activeBiomarkerId);
};
