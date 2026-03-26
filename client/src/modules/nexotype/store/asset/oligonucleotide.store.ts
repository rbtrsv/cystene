'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Oligonucleotide,
  CreateOligonucleotide,
  UpdateOligonucleotide,
} from '@/modules/nexotype/schemas/asset/oligonucleotide.schemas';
import {
  getOligonucleotides,
  getOligonucleotide,
  createOligonucleotide as apiCreateOligonucleotide,
  updateOligonucleotide as apiUpdateOligonucleotide,
  deleteOligonucleotide as apiDeleteOligonucleotide,
  ListOligonucleotidesParams,
} from '@/modules/nexotype/service/asset/oligonucleotide.service';

/**
 * Oligonucleotide store state interface
 */
export interface OligonucleotideState {
  // State
  oligonucleotides: Oligonucleotide[];
  activeOligonucleotideId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOligonucleotides: (params?: ListOligonucleotidesParams) => Promise<boolean>;
  fetchOligonucleotide: (id: number) => Promise<Oligonucleotide | null>;
  createOligonucleotide: (data: CreateOligonucleotide) => Promise<boolean>;
  updateOligonucleotide: (id: number, data: UpdateOligonucleotide) => Promise<boolean>;
  deleteOligonucleotide: (id: number) => Promise<boolean>;
  setActiveOligonucleotide: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create oligonucleotide store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOligonucleotideStore = create<OligonucleotideState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        oligonucleotides: [],
        activeOligonucleotideId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize oligonucleotides state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOligonucleotides();

            if (response.success && response.data) {
              set((state) => {
                state.oligonucleotides = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize oligonucleotides',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize oligonucleotides',
            });
          }
        },

        /**
         * Fetch all oligonucleotides with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchOligonucleotides: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOligonucleotides(params);

            if (response.success && response.data) {
              set((state) => {
                state.oligonucleotides = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch oligonucleotides',
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
         * Fetch a specific oligonucleotide by ID
         * @param id Oligonucleotide ID
         * @returns Promise with oligonucleotide or null
         */
        fetchOligonucleotide: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOligonucleotide(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch oligonucleotide with ID ${id}`,
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
         * Create a new oligonucleotide
         * @param data Oligonucleotide creation data
         * @returns Success status
         */
        createOligonucleotide: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateOligonucleotide(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchOligonucleotides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create oligonucleotide',
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
         * Update an existing oligonucleotide
         * @param id Oligonucleotide ID
         * @param data Oligonucleotide update data
         * @returns Success status
         */
        updateOligonucleotide: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateOligonucleotide(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchOligonucleotides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update oligonucleotide with ID ${id}`,
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
         * Delete a oligonucleotide
         * @param id Oligonucleotide ID
         * @returns Success status
         */
        deleteOligonucleotide: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteOligonucleotide(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchOligonucleotides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete oligonucleotide with ID ${id}`,
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
         * Set active oligonucleotide
         * @param id ID of the active oligonucleotide or null
         */
        setActiveOligonucleotide: (id) => {
          set((state) => {
            state.activeOligonucleotideId = id;
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
            oligonucleotides: [],
            activeOligonucleotideId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-oligonucleotide-storage',
        partialize: (state) => ({
          activeOligonucleotideId: state.activeOligonucleotideId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get oligonucleotide by ID from store
 * @param id Oligonucleotide ID
 * @returns The oligonucleotide or undefined if not found
 */
export const getOligonucleotideById = (id: number): Oligonucleotide | undefined => {
  const { oligonucleotides } = useOligonucleotideStore.getState();
  return oligonucleotides.find((oligo) => oligo.id === id);
};

/**
 * Get active oligonucleotide from store
 * @returns The active oligonucleotide or undefined if not set
 */
export const getActiveOligonucleotide = (): Oligonucleotide | undefined => {
  const { oligonucleotides, activeOligonucleotideId } = useOligonucleotideStore.getState();
  return oligonucleotides.find((oligo) => oligo.id === activeOligonucleotideId);
};
