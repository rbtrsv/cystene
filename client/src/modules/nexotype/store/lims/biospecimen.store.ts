'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Biospecimen,
  CreateBiospecimen,
  UpdateBiospecimen,
} from '@/modules/nexotype/schemas/lims/biospecimen.schemas';
import {
  getBiospecimens,
  getBiospecimen,
  createBiospecimen as apiCreateBiospecimen,
  updateBiospecimen as apiUpdateBiospecimen,
  deleteBiospecimen as apiDeleteBiospecimen,
  ListBiospecimensParams,
} from '@/modules/nexotype/service/lims/biospecimen.service';

/**
 * Biospecimen store state interface
 */
export interface BiospecimenState {
  // State
  biospecimens: Biospecimen[];
  activeBiospecimenId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBiospecimens: (params?: ListBiospecimensParams) => Promise<boolean>;
  fetchBiospecimen: (id: number) => Promise<Biospecimen | null>;
  createBiospecimen: (data: CreateBiospecimen) => Promise<boolean>;
  updateBiospecimen: (id: number, data: UpdateBiospecimen) => Promise<boolean>;
  deleteBiospecimen: (id: number) => Promise<boolean>;
  setActiveBiospecimen: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create biospecimen store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBiospecimenStore = create<BiospecimenState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        biospecimens: [],
        activeBiospecimenId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize biospecimens state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiospecimens();

            if (response.success && response.data) {
              set((state) => {
                state.biospecimens = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize biospecimens',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize biospecimens',
            });
          }
        },

        /**
         * Fetch all biospecimens with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchBiospecimens: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiospecimens(params);

            if (response.success && response.data) {
              set((state) => {
                state.biospecimens = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch biospecimens',
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
         * Fetch a specific biospecimen by ID
         * @param id Biospecimen ID
         * @returns Promise with biospecimen or null
         */
        fetchBiospecimen: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiospecimen(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch biospecimen with ID ${id}`,
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
         * Create a new biospecimen
         * @param data Biospecimen creation data
         * @returns Success status
         */
        createBiospecimen: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateBiospecimen(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchBiospecimens();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create biospecimen',
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
         * Update an existing biospecimen
         * @param id Biospecimen ID
         * @param data Biospecimen update data
         * @returns Success status
         */
        updateBiospecimen: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateBiospecimen(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchBiospecimens();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update biospecimen with ID ${id}`,
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
         * Delete a biospecimen
         * @param id Biospecimen ID
         * @returns Success status
         */
        deleteBiospecimen: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteBiospecimen(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchBiospecimens();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete biospecimen with ID ${id}`,
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
         * Set active biospecimen
         * @param id ID of the active biospecimen or null
         */
        setActiveBiospecimen: (id) => {
          set((state) => {
            state.activeBiospecimenId = id;
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
            biospecimens: [],
            activeBiospecimenId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-biospecimen-storage',
        partialize: (state) => ({
          activeBiospecimenId: state.activeBiospecimenId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get biospecimen by ID from store
 * @param id Biospecimen ID
 * @returns The biospecimen or undefined if not found
 */
export const getBiospecimenById = (id: number): Biospecimen | undefined => {
  const { biospecimens } = useBiospecimenStore.getState();
  return biospecimens.find((b) => b.id === id);
};

/**
 * Get active biospecimen from store
 * @returns The active biospecimen or undefined if not set
 */
export const getActiveBiospecimen = (): Biospecimen | undefined => {
  const { biospecimens, activeBiospecimenId } = useBiospecimenStore.getState();
  return biospecimens.find((b) => b.id === activeBiospecimenId);
};
