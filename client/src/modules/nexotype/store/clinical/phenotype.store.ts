'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Phenotype,
  CreatePhenotype,
  UpdatePhenotype,
} from '@/modules/nexotype/schemas/clinical/phenotype.schemas';
import {
  getPhenotypes,
  getPhenotype,
  createPhenotype as apiCreatePhenotype,
  updatePhenotype as apiUpdatePhenotype,
  deletePhenotype as apiDeletePhenotype,
  ListPhenotypesParams,
} from '@/modules/nexotype/service/clinical/phenotype.service';

/**
 * Phenotype store state interface
 */
export interface PhenotypeState {
  // State
  phenotypes: Phenotype[];
  activePhenotypeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPhenotypes: (params?: ListPhenotypesParams) => Promise<boolean>;
  fetchPhenotype: (id: number) => Promise<Phenotype | null>;
  createPhenotype: (data: CreatePhenotype) => Promise<boolean>;
  updatePhenotype: (id: number, data: UpdatePhenotype) => Promise<boolean>;
  deletePhenotype: (id: number) => Promise<boolean>;
  setActivePhenotype: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create phenotype store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePhenotypeStore = create<PhenotypeState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      phenotypes: [],
      activePhenotypeId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize phenotypes state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPhenotypes();

          if (response.success && response.data) {
            set((state) => {
              state.phenotypes = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize phenotypes',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize phenotypes',
          });
        }
      },

      /**
       * Fetch all phenotypes with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchPhenotypes: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPhenotypes(params);

          if (response.success && response.data) {
            set((state) => {
              state.phenotypes = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch phenotypes',
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
       * Fetch a specific phenotype by ID
       * @param id Phenotype ID
       * @returns Promise with phenotype or null
       */
      fetchPhenotype: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPhenotype(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch phenotype with ID ${id}`,
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
       * Create a new phenotype
       * @param data Phenotype creation data
       * @returns Success status
       */
      createPhenotype: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreatePhenotype(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchPhenotypes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create phenotype',
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
       * Update an existing phenotype
       * @param id Phenotype ID
       * @param data Phenotype update data
       * @returns Success status
       */
      updatePhenotype: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdatePhenotype(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchPhenotypes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update phenotype with ID ${id}`,
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
       * Delete a phenotype
       * @param id Phenotype ID
       * @returns Success status
       */
      deletePhenotype: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeletePhenotype(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchPhenotypes();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete phenotype with ID ${id}`,
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
       * Set active phenotype
       * @param id ID of the active phenotype or null
       */
      setActivePhenotype: (id) => {
        set((state) => {
          state.activePhenotypeId = id;
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
          phenotypes: [],
          activePhenotypeId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-phenotype-storage',
        partialize: (state) => ({
          activePhenotypeId: state.activePhenotypeId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get phenotype by ID from store
 * @param id Phenotype ID
 * @returns The phenotype or undefined if not found
 */
export const getPhenotypeById = (id: number): Phenotype | undefined => {
  const { phenotypes } = usePhenotypeStore.getState();
  return phenotypes.find((ph) => ph.id === id);
};

/**
 * Get active phenotype from store
 * @returns The active phenotype or undefined if not set
 */
export const getActivePhenotype = (): Phenotype | undefined => {
  const { phenotypes, activePhenotypeId } = usePhenotypeStore.getState();
  return phenotypes.find((ph) => ph.id === activePhenotypeId);
};
