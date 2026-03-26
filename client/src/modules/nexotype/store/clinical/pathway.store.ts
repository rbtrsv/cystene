'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Pathway,
  CreatePathway,
  UpdatePathway,
} from '@/modules/nexotype/schemas/clinical/pathway.schemas';
import {
  getPathways,
  getPathway,
  createPathway as apiCreatePathway,
  updatePathway as apiUpdatePathway,
  deletePathway as apiDeletePathway,
  ListPathwaysParams,
} from '@/modules/nexotype/service/clinical/pathway.service';

/**
 * Pathway store state interface
 */
export interface PathwayState {
  // State
  pathways: Pathway[];
  activePathwayId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPathways: (params?: ListPathwaysParams) => Promise<boolean>;
  fetchPathway: (id: number) => Promise<Pathway | null>;
  createPathway: (data: CreatePathway) => Promise<boolean>;
  updatePathway: (id: number, data: UpdatePathway) => Promise<boolean>;
  deletePathway: (id: number) => Promise<boolean>;
  setActivePathway: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create pathway store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePathwayStore = create<PathwayState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      pathways: [],
      activePathwayId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize pathways state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPathways();

          if (response.success && response.data) {
            set((state) => {
              state.pathways = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize pathways',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize pathways',
          });
        }
      },

      /**
       * Fetch all pathways with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchPathways: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPathways(params);

          if (response.success && response.data) {
            set((state) => {
              state.pathways = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch pathways',
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
       * Fetch a specific pathway by ID
       * @param id Pathway ID
       * @returns Promise with pathway or null
       */
      fetchPathway: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPathway(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch pathway with ID ${id}`,
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
       * Create a new pathway
       * @param data Pathway creation data
       * @returns Success status
       */
      createPathway: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreatePathway(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchPathways();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create pathway',
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
       * Update an existing pathway
       * @param id Pathway ID
       * @param data Pathway update data
       * @returns Success status
       */
      updatePathway: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdatePathway(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchPathways();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update pathway with ID ${id}`,
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
       * Delete a pathway
       * @param id Pathway ID
       * @returns Success status
       */
      deletePathway: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeletePathway(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchPathways();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete pathway with ID ${id}`,
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
       * Set active pathway
       * @param id ID of the active pathway or null
       */
      setActivePathway: (id) => {
        set((state) => {
          state.activePathwayId = id;
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
          pathways: [],
          activePathwayId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-pathway-storage',
        partialize: (state) => ({
          activePathwayId: state.activePathwayId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get pathway by ID from store
 * @param id Pathway ID
 * @returns The pathway or undefined if not found
 */
export const getPathwayById = (id: number): Pathway | undefined => {
  const { pathways } = usePathwayStore.getState();
  return pathways.find((pw) => pw.id === id);
};

/**
 * Get active pathway from store
 * @returns The active pathway or undefined if not set
 */
export const getActivePathway = (): Pathway | undefined => {
  const { pathways, activePathwayId } = usePathwayStore.getState();
  return pathways.find((pw) => pw.id === activePathwayId);
};
