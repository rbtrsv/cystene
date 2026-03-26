'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TherapeuticPeptide,
  CreateTherapeuticPeptide,
  UpdateTherapeuticPeptide,
} from '@/modules/nexotype/schemas/asset/therapeutic-peptide.schemas';
import {
  getTherapeuticPeptides,
  getTherapeuticPeptide,
  createTherapeuticPeptide as apiCreateTherapeuticPeptide,
  updateTherapeuticPeptide as apiUpdateTherapeuticPeptide,
  deleteTherapeuticPeptide as apiDeleteTherapeuticPeptide,
  ListTherapeuticPeptidesParams,
} from '@/modules/nexotype/service/asset/therapeutic-peptide.service';

/**
 * TherapeuticPeptide store state interface
 */
export interface TherapeuticPeptideState {
  // State
  therapeuticPeptides: TherapeuticPeptide[];
  activeTherapeuticPeptideId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTherapeuticPeptides: (params?: ListTherapeuticPeptidesParams) => Promise<boolean>;
  fetchTherapeuticPeptide: (id: number) => Promise<TherapeuticPeptide | null>;
  createTherapeuticPeptide: (data: CreateTherapeuticPeptide) => Promise<boolean>;
  updateTherapeuticPeptide: (id: number, data: UpdateTherapeuticPeptide) => Promise<boolean>;
  deleteTherapeuticPeptide: (id: number) => Promise<boolean>;
  setActiveTherapeuticPeptide: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create therapeutic peptide store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTherapeuticPeptideStore = create<TherapeuticPeptideState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        therapeuticPeptides: [],
        activeTherapeuticPeptideId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize therapeutic peptides state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticPeptides();

            if (response.success && response.data) {
              set((state) => {
                state.therapeuticPeptides = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize therapeutic peptides',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize therapeutic peptides',
            });
          }
        },

        /**
         * Fetch all therapeutic peptides with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchTherapeuticPeptides: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticPeptides(params);

            if (response.success && response.data) {
              set((state) => {
                state.therapeuticPeptides = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch therapeutic peptides',
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
         * Fetch a specific therapeutic peptide by ID
         * @param id TherapeuticPeptide ID
         * @returns Promise with therapeutic peptide or null
         */
        fetchTherapeuticPeptide: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticPeptide(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch therapeutic peptide with ID ${id}`,
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
         * Create a new therapeutic peptide
         * @param data TherapeuticPeptide creation data
         * @returns Success status
         */
        createTherapeuticPeptide: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateTherapeuticPeptide(data);

            if (response.success && response.data) {
              await get().fetchTherapeuticPeptides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create therapeutic peptide',
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
         * Update an existing therapeutic peptide
         * @param id TherapeuticPeptide ID
         * @param data TherapeuticPeptide update data
         * @returns Success status
         */
        updateTherapeuticPeptide: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateTherapeuticPeptide(id, data);

            if (response.success && response.data) {
              await get().fetchTherapeuticPeptides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update therapeutic peptide with ID ${id}`,
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
         * Delete a therapeutic peptide
         * @param id TherapeuticPeptide ID
         * @returns Success status
         */
        deleteTherapeuticPeptide: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteTherapeuticPeptide(id);

            if (response.success) {
              await get().fetchTherapeuticPeptides();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete therapeutic peptide with ID ${id}`,
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

        setActiveTherapeuticPeptide: (id) => {
          set((state) => {
            state.activeTherapeuticPeptideId = id;
          });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set({
            therapeuticPeptides: [],
            activeTherapeuticPeptideId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-therapeutic-peptide-storage',
        partialize: (state) => ({
          activeTherapeuticPeptideId: state.activeTherapeuticPeptideId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get therapeutic peptide by ID from store
 * @param id TherapeuticPeptide ID
 * @returns The therapeutic peptide or undefined if not found
 */
export const getTherapeuticPeptideById = (id: number): TherapeuticPeptide | undefined => {
  const { therapeuticPeptides } = useTherapeuticPeptideStore.getState();
  return therapeuticPeptides.find((peptide) => peptide.id === id);
};

/**
 * Get active therapeutic peptide from store
 * @returns The active therapeutic peptide or undefined if not set
 */
export const getActiveTherapeuticPeptide = (): TherapeuticPeptide | undefined => {
  const { therapeuticPeptides, activeTherapeuticPeptideId } = useTherapeuticPeptideStore.getState();
  return therapeuticPeptides.find((peptide) => peptide.id === activeTherapeuticPeptideId);
};
