'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Biologic,
  CreateBiologic,
  UpdateBiologic,
} from '@/modules/nexotype/schemas/asset/biologic.schemas';
import {
  getBiologics,
  getBiologic,
  createBiologic as apiCreateBiologic,
  updateBiologic as apiUpdateBiologic,
  deleteBiologic as apiDeleteBiologic,
  ListBiologicsParams,
} from '@/modules/nexotype/service/asset/biologic.service';

/**
 * Biologic store state interface
 */
export interface BiologicState {
  // State
  biologics: Biologic[];
  activeBiologicId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBiologics: (params?: ListBiologicsParams) => Promise<boolean>;
  fetchBiologic: (id: number) => Promise<Biologic | null>;
  createBiologic: (data: CreateBiologic) => Promise<boolean>;
  updateBiologic: (id: number, data: UpdateBiologic) => Promise<boolean>;
  deleteBiologic: (id: number) => Promise<boolean>;
  setActiveBiologic: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create biologic store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBiologicStore = create<BiologicState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        biologics: [],
        activeBiologicId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize biologics state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiologics();

            if (response.success && response.data) {
              set((state) => {
                state.biologics = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize biologics',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize biologics',
            });
          }
        },

        /**
         * Fetch all biologics with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchBiologics: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiologics(params);

            if (response.success && response.data) {
              set((state) => {
                state.biologics = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch biologics',
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
         * Fetch a specific biologic by ID
         * @param id Biologic ID
         * @returns Promise with biologic or null
         */
        fetchBiologic: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiologic(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch biologic with ID ${id}`,
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
         * Create a new biologic
         * @param data Biologic creation data
         * @returns Success status
         */
        createBiologic: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateBiologic(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchBiologics();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create biologic',
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
         * Update an existing biologic
         * @param id Biologic ID
         * @param data Biologic update data
         * @returns Success status
         */
        updateBiologic: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateBiologic(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchBiologics();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update biologic with ID ${id}`,
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
         * Delete a biologic
         * @param id Biologic ID
         * @returns Success status
         */
        deleteBiologic: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteBiologic(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchBiologics();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete biologic with ID ${id}`,
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
         * Set active biologic
         * @param id ID of the active biologic or null
         */
        setActiveBiologic: (id) => {
          set((state) => {
            state.activeBiologicId = id;
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
            biologics: [],
            activeBiologicId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-biologic-storage',
        partialize: (state) => ({
          activeBiologicId: state.activeBiologicId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get biologic by ID from store
 * @param id Biologic ID
 * @returns The biologic or undefined if not found
 */
export const getBiologicById = (id: number): Biologic | undefined => {
  const { biologics } = useBiologicStore.getState();
  return biologics.find((bio) => bio.id === id);
};

/**
 * Get active biologic from store
 * @returns The active biologic or undefined if not set
 */
export const getActiveBiologic = (): Biologic | undefined => {
  const { biologics, activeBiologicId } = useBiologicStore.getState();
  return biologics.find((bio) => bio.id === activeBiologicId);
};
