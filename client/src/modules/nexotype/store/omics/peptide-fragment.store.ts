'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PeptideFragment,
  CreatePeptideFragment,
  UpdatePeptideFragment,
} from '@/modules/nexotype/schemas/omics/peptide-fragment.schemas';
import {
  getPeptideFragments,
  getPeptideFragment,
  createPeptideFragment as apiCreatePeptideFragment,
  updatePeptideFragment as apiUpdatePeptideFragment,
  deletePeptideFragment as apiDeletePeptideFragment,
  ListPeptideFragmentsParams,
} from '@/modules/nexotype/service/omics/peptide-fragment.service';

/**
 * Peptide fragment store state interface
 */
export interface PeptideFragmentState {
  // State
  peptideFragments: PeptideFragment[];
  activePeptideFragmentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPeptideFragments: (params?: ListPeptideFragmentsParams) => Promise<boolean>;
  fetchPeptideFragment: (id: number) => Promise<PeptideFragment | null>;
  createPeptideFragment: (data: CreatePeptideFragment) => Promise<boolean>;
  updatePeptideFragment: (id: number, data: UpdatePeptideFragment) => Promise<boolean>;
  deletePeptideFragment: (id: number) => Promise<boolean>;
  setActivePeptideFragment: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create peptide fragment store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePeptideFragmentStore = create<PeptideFragmentState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      peptideFragments: [],
      activePeptideFragmentId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize peptide fragments state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPeptideFragments();

          if (response.success && response.data) {
            set((state) => {
              state.peptideFragments = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize peptide fragments',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize peptide fragments',
          });
        }
      },

      /**
       * Fetch all peptide fragments with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchPeptideFragments: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPeptideFragments(params);

          if (response.success && response.data) {
            set((state) => {
              state.peptideFragments = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch peptide fragments',
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
       * Fetch a specific peptide fragment by ID
       * @param id Peptide fragment ID
       * @returns Promise with peptide fragment or null
       */
      fetchPeptideFragment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPeptideFragment(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch peptide fragment with ID ${id}`,
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
       * Create a new peptide fragment
       * @param data Peptide fragment creation data
       * @returns Success status
       */
      createPeptideFragment: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreatePeptideFragment(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchPeptideFragments();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create peptide fragment',
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
       * Update an existing peptide fragment
       * @param id Peptide fragment ID
       * @param data Peptide fragment update data
       * @returns Success status
       */
      updatePeptideFragment: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdatePeptideFragment(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchPeptideFragments();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update peptide fragment with ID ${id}`,
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
       * Delete a peptide fragment
       * @param id Peptide fragment ID
       * @returns Success status
       */
      deletePeptideFragment: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeletePeptideFragment(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchPeptideFragments();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete peptide fragment with ID ${id}`,
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
       * Set active peptide fragment
       * @param id ID of the active peptide fragment or null
       */
      setActivePeptideFragment: (id) => {
        set((state) => {
          state.activePeptideFragmentId = id;
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
          peptideFragments: [],
          activePeptideFragmentId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-peptide-fragment-storage',
        partialize: (state) => ({
          activePeptideFragmentId: state.activePeptideFragmentId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get peptide fragment by ID from store
 * @param id Peptide fragment ID
 * @returns The peptide fragment or undefined if not found
 */
export const getPeptideFragmentById = (id: number): PeptideFragment | undefined => {
  const { peptideFragments } = usePeptideFragmentStore.getState();
  return peptideFragments.find((fragment) => fragment.id === id);
};

/**
 * Get active peptide fragment from store
 * @returns The active peptide fragment or undefined if not set
 */
export const getActivePeptideFragment = (): PeptideFragment | undefined => {
  const { peptideFragments, activePeptideFragmentId } = usePeptideFragmentStore.getState();
  return peptideFragments.find((fragment) => fragment.id === activePeptideFragmentId);
};
