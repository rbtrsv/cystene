'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Exon,
  CreateExon,
  UpdateExon,
} from '@/modules/nexotype/schemas/omics/exon.schemas';
import {
  getExons,
  getExon,
  createExon as apiCreateExon,
  updateExon as apiUpdateExon,
  deleteExon as apiDeleteExon,
  ListExonsParams,
} from '@/modules/nexotype/service/omics/exon.service';

/**
 * Exon store state interface
 */
export interface ExonState {
  // State
  exons: Exon[];
  activeExonId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchExons: (params?: ListExonsParams) => Promise<boolean>;
  fetchExon: (id: number) => Promise<Exon | null>;
  createExon: (data: CreateExon) => Promise<boolean>;
  updateExon: (id: number, data: UpdateExon) => Promise<boolean>;
  deleteExon: (id: number) => Promise<boolean>;
  setActiveExon: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create exon store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useExonStore = create<ExonState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      exons: [],
      activeExonId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize exons state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExons();

          if (response.success && response.data) {
            set((state) => {
              state.exons = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize exons',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize exons',
          });
        }
      },

      /**
       * Fetch all exons with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchExons: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExons(params);

          if (response.success && response.data) {
            set((state) => {
              state.exons = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch exons',
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
       * Fetch a specific exon by ID
       * @param id Exon ID
       * @returns Promise with exon or null
       */
      fetchExon: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExon(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch exon with ID ${id}`,
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
       * Create a new exon
       * @param data Exon creation data
       * @returns Success status
       */
      createExon: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateExon(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchExons();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create exon',
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
       * Update an existing exon
       * @param id Exon ID
       * @param data Exon update data
       * @returns Success status
       */
      updateExon: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateExon(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchExons();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update exon with ID ${id}`,
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
       * Delete an exon
       * @param id Exon ID
       * @returns Success status
       */
      deleteExon: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteExon(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchExons();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete exon with ID ${id}`,
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
       * Set active exon
       * @param id ID of the active exon or null
       */
      setActiveExon: (id) => {
        set((state) => {
          state.activeExonId = id;
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
          exons: [],
          activeExonId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-exon-storage',
        partialize: (state) => ({
          activeExonId: state.activeExonId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get exon by ID from store
 * @param id Exon ID
 * @returns The exon or undefined if not found
 */
export const getExonById = (id: number): Exon | undefined => {
  const { exons } = useExonStore.getState();
  return exons.find((e) => e.id === id);
};

/**
 * Get active exon from store
 * @returns The active exon or undefined if not set
 */
export const getActiveExon = (): Exon | undefined => {
  const { exons, activeExonId } = useExonStore.getState();
  return exons.find((e) => e.id === activeExonId);
};
