'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Gene,
  CreateGene,
  UpdateGene,
} from '@/modules/nexotype/schemas/omics/gene.schemas';
import {
  getGenes,
  getGene,
  createGene as apiCreateGene,
  updateGene as apiUpdateGene,
  deleteGene as apiDeleteGene,
  ListGenesParams,
} from '@/modules/nexotype/service/omics/gene.service';

/**
 * Gene store state interface
 */
export interface GeneState {
  // State
  genes: Gene[];
  activeGeneId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchGenes: (params?: ListGenesParams) => Promise<boolean>;
  fetchGene: (id: number) => Promise<Gene | null>;
  createGene: (data: CreateGene) => Promise<boolean>;
  updateGene: (id: number, data: UpdateGene) => Promise<boolean>;
  deleteGene: (id: number) => Promise<boolean>;
  setActiveGene: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create gene store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useGeneStore = create<GeneState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      genes: [],
      activeGeneId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize genes state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getGenes();

          if (response.success && response.data) {
            set((state) => {
              state.genes = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize genes',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize genes',
          });
        }
      },

      /**
       * Fetch all genes with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchGenes: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getGenes(params);

          if (response.success && response.data) {
            set((state) => {
              state.genes = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch genes',
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
       * Fetch a specific gene by ID
       * @param id Gene ID
       * @returns Promise with gene or null
       */
      fetchGene: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getGene(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch gene with ID ${id}`,
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
       * Create a new gene
       * @param data Gene creation data
       * @returns Success status
       */
      createGene: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateGene(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchGenes();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create gene',
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
       * Update an existing gene
       * @param id Gene ID
       * @param data Gene update data
       * @returns Success status
       */
      updateGene: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateGene(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchGenes();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update gene with ID ${id}`,
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
       * Delete a gene
       * @param id Gene ID
       * @returns Success status
       */
      deleteGene: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteGene(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchGenes();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete gene with ID ${id}`,
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
       * Set active gene
       * @param id ID of the active gene or null
       */
      setActiveGene: (id) => {
        set((state) => {
          state.activeGeneId = id;
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
          genes: [],
          activeGeneId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-gene-storage',
        partialize: (state) => ({
          activeGeneId: state.activeGeneId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get gene by ID from store
 * @param id Gene ID
 * @returns The gene or undefined if not found
 */
export const getGeneById = (id: number): Gene | undefined => {
  const { genes } = useGeneStore.getState();
  return genes.find((gene) => gene.id === id);
};

/**
 * Get active gene from store
 * @returns The active gene or undefined if not set
 */
export const getActiveGene = (): Gene | undefined => {
  const { genes, activeGeneId } = useGeneStore.getState();
  return genes.find((gene) => gene.id === activeGeneId);
};
