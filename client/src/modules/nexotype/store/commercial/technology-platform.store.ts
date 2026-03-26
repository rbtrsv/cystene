'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TechnologyPlatform,
  CreateTechnologyPlatform,
  UpdateTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/technology-platform.schemas';
import {
  getTechnologyPlatforms,
  getTechnologyPlatform,
  createTechnologyPlatform as apiCreateTechnologyPlatform,
  updateTechnologyPlatform as apiUpdateTechnologyPlatform,
  deleteTechnologyPlatform as apiDeleteTechnologyPlatform,
  ListTechnologyPlatformsParams,
} from '@/modules/nexotype/service/commercial/technology-platform.service';

/**
 * TechnologyPlatform store state interface
 */
export interface TechnologyPlatformState {
  // State
  technologyPlatforms: TechnologyPlatform[];
  activeTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTechnologyPlatforms: (params?: ListTechnologyPlatformsParams) => Promise<boolean>;
  fetchTechnologyPlatform: (id: number) => Promise<TechnologyPlatform | null>;
  createTechnologyPlatform: (data: CreateTechnologyPlatform) => Promise<boolean>;
  updateTechnologyPlatform: (id: number, data: UpdateTechnologyPlatform) => Promise<boolean>;
  deleteTechnologyPlatform: (id: number) => Promise<boolean>;
  setActiveTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create technology platform store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTechnologyPlatformStore = create<TechnologyPlatformState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        technologyPlatforms: [],
        activeTechnologyPlatformId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize technology platforms state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTechnologyPlatforms();

            if (response.success && response.data) {
              set((state) => {
                state.technologyPlatforms = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize technology platforms',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize technology platforms',
            });
          }
        },

        /**
         * Fetch all technology platforms with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchTechnologyPlatforms: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTechnologyPlatforms(params);

            if (response.success && response.data) {
              set((state) => {
                state.technologyPlatforms = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch technology platforms',
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
         * Fetch a specific technology platform by ID
         * @param id TechnologyPlatform ID
         * @returns Promise with technology platform or null
         */
        fetchTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTechnologyPlatform(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch technology platform with ID ${id}`,
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
         * Create a new technology platform
         * @param data TechnologyPlatform creation data
         * @returns Success status
         */
        createTechnologyPlatform: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateTechnologyPlatform(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create technology platform',
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
         * Update an existing technology platform
         * @param id TechnologyPlatform ID
         * @param data TechnologyPlatform update data
         * @returns Success status
         */
        updateTechnologyPlatform: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateTechnologyPlatform(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update technology platform with ID ${id}`,
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
         * Delete a technology platform
         * @param id TechnologyPlatform ID
         * @returns Success status
         */
        deleteTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteTechnologyPlatform(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete technology platform with ID ${id}`,
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
         * Set active technology platform
         * @param id ID of the active technology platform or null
         */
        setActiveTechnologyPlatform: (id) => {
          set((state) => {
            state.activeTechnologyPlatformId = id;
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
            technologyPlatforms: [],
            activeTechnologyPlatformId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-technology-platform-storage',
        partialize: (state) => ({
          activeTechnologyPlatformId: state.activeTechnologyPlatformId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get technology platform by ID from store
 * @param id TechnologyPlatform ID
 * @returns The technology platform or undefined if not found
 */
export const getTechnologyPlatformById = (id: number): TechnologyPlatform | undefined => {
  const { technologyPlatforms } = useTechnologyPlatformStore.getState();
  return technologyPlatforms.find((tp) => tp.id === id);
};

/**
 * Get active technology platform from store
 * @returns The active technology platform or undefined if not set
 */
export const getActiveTechnologyPlatform = (): TechnologyPlatform | undefined => {
  const { technologyPlatforms, activeTechnologyPlatformId } = useTechnologyPlatformStore.getState();
  return technologyPlatforms.find((tp) => tp.id === activeTechnologyPlatformId);
};
