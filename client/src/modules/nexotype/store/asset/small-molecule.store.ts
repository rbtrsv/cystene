'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SmallMolecule,
  CreateSmallMolecule,
  UpdateSmallMolecule,
} from '@/modules/nexotype/schemas/asset/small-molecule.schemas';
import {
  getSmallMolecules,
  getSmallMolecule,
  createSmallMolecule as apiCreateSmallMolecule,
  updateSmallMolecule as apiUpdateSmallMolecule,
  deleteSmallMolecule as apiDeleteSmallMolecule,
  ListSmallMoleculesParams,
} from '@/modules/nexotype/service/asset/small-molecule.service';

/**
 * Small molecule store state interface
 */
export interface SmallMoleculeState {
  // State
  smallMolecules: SmallMolecule[];
  activeSmallMoleculeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSmallMolecules: (params?: ListSmallMoleculesParams) => Promise<boolean>;
  fetchSmallMolecule: (id: number) => Promise<SmallMolecule | null>;
  createSmallMolecule: (data: CreateSmallMolecule) => Promise<boolean>;
  updateSmallMolecule: (id: number, data: UpdateSmallMolecule) => Promise<boolean>;
  deleteSmallMolecule: (id: number) => Promise<boolean>;
  setActiveSmallMolecule: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create small molecule store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSmallMoleculeStore = create<SmallMoleculeState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      smallMolecules: [],
      activeSmallMoleculeId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize small molecules state
       */
      // Bootstrap initial list state for first-load screens.

      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSmallMolecules();

          if (response.success && response.data) {
            set((state) => {
              state.smallMolecules = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize small molecules',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize small molecules',
          });
        }
      },

      /**
       * Fetch all small molecules with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchSmallMolecules: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSmallMolecules(params);

          if (response.success && response.data) {
            set((state) => {
              state.smallMolecules = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch small molecules',
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
       * Fetch a specific small molecule by ID
       * @param id Small molecule ID
       * @returns Promise with small molecule or null
       */
      fetchSmallMolecule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSmallMolecule(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch small molecule with ID ${id}`,
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
       * Create a new small molecule
       * @param data Small molecule creation data
       * @returns Success status
       */
      // Create and refresh list so UI remains consistent.

      createSmallMolecule: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSmallMolecule(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchSmallMolecules();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create small molecule',
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
       * Update an existing small molecule
       * @param id Small molecule ID
       * @param data Small molecule update data
       * @returns Success status
       */
      updateSmallMolecule: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSmallMolecule(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchSmallMolecules();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update small molecule with ID ${id}`,
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
       * Delete a small molecule
       * @param id Small molecule ID
       * @returns Success status
       */
      // Soft-delete and refresh list so archived rows are hidden.

      deleteSmallMolecule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSmallMolecule(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchSmallMolecules();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete small molecule with ID ${id}`,
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
       * Set active small molecule
       * @param id ID of the active small molecule or null
       */
      setActiveSmallMolecule: (id) => {
        set((state) => {
          state.activeSmallMoleculeId = id;
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
          smallMolecules: [],
          activeSmallMoleculeId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-small-molecule-storage',
        partialize: (state) => ({
          activeSmallMoleculeId: state.activeSmallMoleculeId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get small molecule by ID from store
 * @param id Small molecule ID
 * @returns The small molecule or undefined if not found
 */
export const getSmallMoleculeById = (id: number): SmallMolecule | undefined => {
  const { smallMolecules } = useSmallMoleculeStore.getState();
  return smallMolecules.find((molecule) => molecule.id === id);
};

/**
 * Get active small molecule from store
 * @returns The active small molecule or undefined if not set
 */
export const getActiveSmallMolecule = (): SmallMolecule | undefined => {
  const { smallMolecules, activeSmallMoleculeId } = useSmallMoleculeStore.getState();
  return smallMolecules.find((molecule) => molecule.id === activeSmallMoleculeId);
};
