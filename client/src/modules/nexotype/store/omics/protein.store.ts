'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Protein,
  CreateProtein,
  UpdateProtein,
} from '@/modules/nexotype/schemas/omics/protein.schemas';
import {
  getProteins,
  getProtein,
  createProtein as apiCreateProtein,
  updateProtein as apiUpdateProtein,
  deleteProtein as apiDeleteProtein,
  ListProteinsParams,
} from '@/modules/nexotype/service/omics/protein.service';

/**
 * Protein store state interface
 */
export interface ProteinState {
  // State
  proteins: Protein[];
  activeProteinId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchProteins: (params?: ListProteinsParams) => Promise<boolean>;
  fetchProtein: (id: number) => Promise<Protein | null>;
  createProtein: (data: CreateProtein) => Promise<boolean>;
  updateProtein: (id: number, data: UpdateProtein) => Promise<boolean>;
  deleteProtein: (id: number) => Promise<boolean>;
  setActiveProtein: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create protein store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useProteinStore = create<ProteinState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      proteins: [],
      activeProteinId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize proteins state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProteins();

          if (response.success && response.data) {
            set((state) => {
              state.proteins = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize proteins',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize proteins',
          });
        }
      },

      /**
       * Fetch all proteins with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchProteins: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProteins(params);

          if (response.success && response.data) {
            set((state) => {
              state.proteins = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch proteins',
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
       * Fetch a specific protein by ID
       * @param id Protein ID
       * @returns Promise with protein or null
       */
      fetchProtein: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getProtein(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch protein with ID ${id}`,
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
       * Create a new protein
       * @param data Protein creation data
       * @returns Success status
       */
      createProtein: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateProtein(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchProteins();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create protein',
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
       * Update an existing protein
       * @param id Protein ID
       * @param data Protein update data
       * @returns Success status
       */
      updateProtein: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateProtein(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchProteins();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update protein with ID ${id}`,
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
       * Delete a protein
       * @param id Protein ID
       * @returns Success status
       */
      deleteProtein: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteProtein(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchProteins();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete protein with ID ${id}`,
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
       * Set active protein
       * @param id ID of the active protein or null
       */
      setActiveProtein: (id) => {
        set((state) => {
          state.activeProteinId = id;
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
          proteins: [],
          activeProteinId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-protein-storage',
        partialize: (state) => ({
          activeProteinId: state.activeProteinId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get protein by ID from store
 * @param id Protein ID
 * @returns The protein or undefined if not found
 */
export const getProteinById = (id: number): Protein | undefined => {
  const { proteins } = useProteinStore.getState();
  return proteins.find((p) => p.id === id);
};

/**
 * Get active protein from store
 * @returns The active protein or undefined if not set
 */
export const getActiveProtein = (): Protein | undefined => {
  const { proteins, activeProteinId } = useProteinStore.getState();
  return proteins.find((p) => p.id === activeProteinId);
};
