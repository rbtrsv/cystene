'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  BiomarkerAssociation,
  CreateBiomarkerAssociation,
  UpdateBiomarkerAssociation,
} from '@/modules/nexotype/schemas/knowledge_graph/biomarker-association.schemas';
import {
  getBiomarkerAssociations,
  getBiomarkerAssociation,
  createBiomarkerAssociation as apiCreateBiomarkerAssociation,
  updateBiomarkerAssociation as apiUpdateBiomarkerAssociation,
  deleteBiomarkerAssociation as apiDeleteBiomarkerAssociation,
  ListBiomarkerAssociationsParams,
} from '@/modules/nexotype/service/knowledge_graph/biomarker-association.service';

/**
 * BiomarkerAssociation store state interface
 */
export interface BiomarkerAssociationState {
  // State
  biomarkerAssociations: BiomarkerAssociation[];
  activeBiomarkerAssociationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBiomarkerAssociations: (params?: ListBiomarkerAssociationsParams) => Promise<boolean>;
  fetchBiomarkerAssociation: (id: number) => Promise<BiomarkerAssociation | null>;
  createBiomarkerAssociation: (data: CreateBiomarkerAssociation) => Promise<boolean>;
  updateBiomarkerAssociation: (id: number, data: UpdateBiomarkerAssociation) => Promise<boolean>;
  deleteBiomarkerAssociation: (id: number) => Promise<boolean>;
  setActiveBiomarkerAssociation: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create biomarker association store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useBiomarkerAssociationStore = create<BiomarkerAssociationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        biomarkerAssociations: [],
        activeBiomarkerAssociationId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize biomarker associations state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiomarkerAssociations();

            if (response.success && response.data) {
              set((state) => {
                state.biomarkerAssociations = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize biomarker associations',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize biomarker associations',
            });
          }
        },

        /**
         * Fetch all biomarker associations with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchBiomarkerAssociations: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiomarkerAssociations(params);

            if (response.success && response.data) {
              set((state) => {
                state.biomarkerAssociations = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch biomarker associations',
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
         * Fetch a specific biomarker association by ID
         * @param id BiomarkerAssociation ID
         * @returns Promise with biomarker association or null
         */
        fetchBiomarkerAssociation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getBiomarkerAssociation(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch biomarker association with ID ${id}`,
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
         * Create a new biomarker association
         * @param data BiomarkerAssociation creation data
         * @returns Success status
         */
        createBiomarkerAssociation: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateBiomarkerAssociation(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchBiomarkerAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create biomarker association',
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
         * Update an existing biomarker association
         * @param id BiomarkerAssociation ID
         * @param data BiomarkerAssociation update data
         * @returns Success status
         */
        updateBiomarkerAssociation: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateBiomarkerAssociation(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchBiomarkerAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update biomarker association with ID ${id}`,
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
         * Delete a biomarker association
         * @param id BiomarkerAssociation ID
         * @returns Success status
         */
        deleteBiomarkerAssociation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteBiomarkerAssociation(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchBiomarkerAssociations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete biomarker association with ID ${id}`,
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
         * Set active biomarker association
         * @param id ID of the active biomarker association or null
         */
        setActiveBiomarkerAssociation: (id) => {
          set((state) => {
            state.activeBiomarkerAssociationId = id;
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
            biomarkerAssociations: [],
            activeBiomarkerAssociationId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-biomarker-association-storage',
        partialize: (state) => ({
          activeBiomarkerAssociationId: state.activeBiomarkerAssociationId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get biomarker association by ID from store
 * @param id BiomarkerAssociation ID
 * @returns The biomarker association or undefined if not found
 */
export const getBiomarkerAssociationById = (id: number): BiomarkerAssociation | undefined => {
  const { biomarkerAssociations } = useBiomarkerAssociationStore.getState();
  return biomarkerAssociations.find((bma) => bma.id === id);
};

/**
 * Get active biomarker association from store
 * @returns The active biomarker association or undefined if not set
 */
export const getActiveBiomarkerAssociation = (): BiomarkerAssociation | undefined => {
  const { biomarkerAssociations, activeBiomarkerAssociationId } = useBiomarkerAssociationStore.getState();
  return biomarkerAssociations.find((bma) => bma.id === activeBiomarkerAssociationId);
};
