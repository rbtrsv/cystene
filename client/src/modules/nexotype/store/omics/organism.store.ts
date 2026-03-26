'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Organism,
  CreateOrganism,
  UpdateOrganism,
} from '@/modules/nexotype/schemas/omics/organism.schemas';
import {
  getOrganisms,
  getOrganism,
  createOrganism as apiCreateOrganism,
  updateOrganism as apiUpdateOrganism,
  deleteOrganism as apiDeleteOrganism,
  ListOrganismsParams,
} from '@/modules/nexotype/service/omics/organism.service';

/**
 * Organism store state interface
 */
export interface OrganismState {
  // State
  organisms: Organism[];
  activeOrganismId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOrganisms: (params?: ListOrganismsParams) => Promise<boolean>;
  fetchOrganism: (id: number) => Promise<Organism | null>;
  createOrganism: (data: CreateOrganism) => Promise<boolean>;
  updateOrganism: (id: number, data: UpdateOrganism) => Promise<boolean>;
  deleteOrganism: (id: number) => Promise<boolean>;
  setActiveOrganism: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create organism store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOrganismStore = create<OrganismState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      organisms: [],
      activeOrganismId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize organisms state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOrganisms();

          if (response.success && response.data) {
            set((state) => {
              state.organisms = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize organisms',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize organisms',
          });
        }
      },

      /**
       * Fetch all organisms with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchOrganisms: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOrganisms(params);

          if (response.success && response.data) {
            set((state) => {
              state.organisms = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch organisms',
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
       * Fetch a specific organism by ID
       * @param id Organism ID
       * @returns Promise with organism or null
       */
      fetchOrganism: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOrganism(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch organism with ID ${id}`,
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
       * Create a new organism
       * @param data Organism creation data
       * @returns Success status
       */
      createOrganism: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateOrganism(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchOrganisms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create organism',
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
       * Update an existing organism
       * @param id Organism ID
       * @param data Organism update data
       * @returns Success status
       */
      updateOrganism: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateOrganism(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchOrganisms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update organism with ID ${id}`,
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
       * Delete an organism
       * @param id Organism ID
       * @returns Success status
       */
      deleteOrganism: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteOrganism(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchOrganisms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete organism with ID ${id}`,
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
       * Set active organism
       * @param id ID of the active organism or null
       */
      setActiveOrganism: (id) => {
        set((state) => {
          state.activeOrganismId = id;
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
          organisms: [],
          activeOrganismId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-organism-storage',
        partialize: (state) => ({
          activeOrganismId: state.activeOrganismId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get organism by ID from store
 * @param id Organism ID
 * @returns The organism or undefined if not found
 */
export const getOrganismById = (id: number): Organism | undefined => {
  const { organisms } = useOrganismStore.getState();
  return organisms.find((org) => org.id === id);
};

/**
 * Get active organism from store
 * @returns The active organism or undefined if not set
 */
export const getActiveOrganism = (): Organism | undefined => {
  const { organisms, activeOrganismId } = useOrganismStore.getState();
  return organisms.find((org) => org.id === activeOrganismId);
};
