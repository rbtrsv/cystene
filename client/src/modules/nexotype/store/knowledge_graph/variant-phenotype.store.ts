'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  VariantPhenotype,
  CreateVariantPhenotype,
  UpdateVariantPhenotype,
} from '@/modules/nexotype/schemas/knowledge_graph/variant-phenotype.schemas';
import {
  getVariantPhenotypes,
  getVariantPhenotype,
  createVariantPhenotype as apiCreateVariantPhenotype,
  updateVariantPhenotype as apiUpdateVariantPhenotype,
  deleteVariantPhenotype as apiDeleteVariantPhenotype,
  ListVariantPhenotypesParams,
} from '@/modules/nexotype/service/knowledge_graph/variant-phenotype.service';

/**
 * VariantPhenotype store state interface
 */
export interface VariantPhenotypeState {
  // State
  variantPhenotypes: VariantPhenotype[];
  activeVariantPhenotypeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchVariantPhenotypes: (params?: ListVariantPhenotypesParams) => Promise<boolean>;
  fetchVariantPhenotype: (id: number) => Promise<VariantPhenotype | null>;
  createVariantPhenotype: (data: CreateVariantPhenotype) => Promise<boolean>;
  updateVariantPhenotype: (id: number, data: UpdateVariantPhenotype) => Promise<boolean>;
  deleteVariantPhenotype: (id: number) => Promise<boolean>;
  setActiveVariantPhenotype: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create variant phenotype store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useVariantPhenotypeStore = create<VariantPhenotypeState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        variantPhenotypes: [],
        activeVariantPhenotypeId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize variant phenotypes state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getVariantPhenotypes();

            if (response.success && response.data) {
              set((state) => {
                state.variantPhenotypes = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize variant phenotypes',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize variant phenotypes',
            });
          }
        },

        /**
         * Fetch all variant phenotypes with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchVariantPhenotypes: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getVariantPhenotypes(params);

            if (response.success && response.data) {
              set((state) => {
                state.variantPhenotypes = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch variant phenotypes',
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
         * Fetch a specific variant phenotype by ID
         * @param id VariantPhenotype ID
         * @returns Promise with variant phenotype or null
         */
        fetchVariantPhenotype: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getVariantPhenotype(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch variant phenotype with ID ${id}`,
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
         * Create a new variant phenotype
         * @param data VariantPhenotype creation data
         * @returns Success status
         */
        createVariantPhenotype: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateVariantPhenotype(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchVariantPhenotypes();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create variant phenotype',
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
         * Update an existing variant phenotype
         * @param id VariantPhenotype ID
         * @param data VariantPhenotype update data
         * @returns Success status
         */
        updateVariantPhenotype: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateVariantPhenotype(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchVariantPhenotypes();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update variant phenotype with ID ${id}`,
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
         * Delete a variant phenotype
         * @param id VariantPhenotype ID
         * @returns Success status
         */
        deleteVariantPhenotype: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteVariantPhenotype(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchVariantPhenotypes();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete variant phenotype with ID ${id}`,
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
         * Set active variant phenotype
         * @param id ID of the active variant phenotype or null
         */
        setActiveVariantPhenotype: (id) => {
          set((state) => {
            state.activeVariantPhenotypeId = id;
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
            variantPhenotypes: [],
            activeVariantPhenotypeId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-variant-phenotype-storage',
        partialize: (state) => ({
          activeVariantPhenotypeId: state.activeVariantPhenotypeId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get variant phenotype by ID from store
 * @param id VariantPhenotype ID
 * @returns The variant phenotype or undefined if not found
 */
export const getVariantPhenotypeById = (id: number): VariantPhenotype | undefined => {
  const { variantPhenotypes } = useVariantPhenotypeStore.getState();
  return variantPhenotypes.find((vp) => vp.id === id);
};

/**
 * Get active variant phenotype from store
 * @returns The active variant phenotype or undefined if not set
 */
export const getActiveVariantPhenotype = (): VariantPhenotype | undefined => {
  const { variantPhenotypes, activeVariantPhenotypeId } = useVariantPhenotypeStore.getState();
  return variantPhenotypes.find((vp) => vp.id === activeVariantPhenotypeId);
};
