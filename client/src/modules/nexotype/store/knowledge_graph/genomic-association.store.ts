'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  GenomicAssociation,
  CreateGenomicAssociation,
  UpdateGenomicAssociation,
} from '@/modules/nexotype/schemas/knowledge_graph/genomic-association.schemas';
import {
  getGenomicAssociations,
  getGenomicAssociation,
  createGenomicAssociation as apiCreateGenomicAssociation,
  updateGenomicAssociation as apiUpdateGenomicAssociation,
  deleteGenomicAssociation as apiDeleteGenomicAssociation,
  ListGenomicAssociationsParams,
} from '@/modules/nexotype/service/knowledge_graph/genomic-association.service';

/**
 * GenomicAssociation store state interface
 */
export interface GenomicAssociationState {
  // State
  genomicAssociations: GenomicAssociation[];
  activeGenomicAssociationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchGenomicAssociations: (params?: ListGenomicAssociationsParams) => Promise<boolean>;
  fetchGenomicAssociation: (id: number) => Promise<GenomicAssociation | null>;
  createGenomicAssociation: (data: CreateGenomicAssociation) => Promise<boolean>;
  updateGenomicAssociation: (id: number, data: UpdateGenomicAssociation) => Promise<boolean>;
  deleteGenomicAssociation: (id: number) => Promise<boolean>;
  setActiveGenomicAssociation: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create genomic association store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useGenomicAssociationStore = create<GenomicAssociationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        genomicAssociations: [],
        activeGenomicAssociationId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize genomic associations state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicAssociations();

            if (response.success && response.data) {
              set((state) => {
                state.genomicAssociations = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize genomic associations',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize genomic associations',
            });
          }
        },

        /**
         * Fetch all genomic associations with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchGenomicAssociations: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicAssociations(params);

            if (response.success && response.data) {
              set((state) => {
                state.genomicAssociations = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch genomic associations',
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
         * Fetch a specific genomic association by ID
         * @param id GenomicAssociation ID
         * @returns Promise with genomic association or null
         */
        fetchGenomicAssociation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicAssociation(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch genomic association with ID ${id}`,
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
         * Create a new genomic association
         * @param data GenomicAssociation creation data
         * @returns Success status
         */
        createGenomicAssociation: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateGenomicAssociation(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchGenomicAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create genomic association',
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
         * Update an existing genomic association
         * @param id GenomicAssociation ID
         * @param data GenomicAssociation update data
         * @returns Success status
         */
        updateGenomicAssociation: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateGenomicAssociation(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchGenomicAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update genomic association with ID ${id}`,
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
         * Delete a genomic association
         * @param id GenomicAssociation ID
         * @returns Success status
         */
        deleteGenomicAssociation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteGenomicAssociation(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchGenomicAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete genomic association with ID ${id}`,
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
         * Set active genomic association
         * @param id ID of the active genomic association or null
         */
        setActiveGenomicAssociation: (id) => {
          set((state) => {
            state.activeGenomicAssociationId = id;
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
            genomicAssociations: [],
            activeGenomicAssociationId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-genomic-association-storage',
        partialize: (state) => ({
          activeGenomicAssociationId: state.activeGenomicAssociationId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get genomic association by ID from store
 * @param id GenomicAssociation ID
 * @returns The genomic association or undefined if not found
 */
export const getGenomicAssociationById = (id: number): GenomicAssociation | undefined => {
  const { genomicAssociations } = useGenomicAssociationStore.getState();
  return genomicAssociations.find((ga) => ga.id === id);
};

/**
 * Get active genomic association from store
 * @returns The active genomic association or undefined if not set
 */
export const getActiveGenomicAssociation = (): GenomicAssociation | undefined => {
  const { genomicAssociations, activeGenomicAssociationId } = useGenomicAssociationStore.getState();
  return genomicAssociations.find((ga) => ga.id === activeGenomicAssociationId);
};
