'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PathwayScore,
  CreatePathwayScore,
  UpdatePathwayScore,
} from '@/modules/nexotype/schemas/user/pathway-score.schemas';
import {
  getPathwayScores,
  getPathwayScore,
  createPathwayScore as apiCreatePathwayScore,
  updatePathwayScore as apiUpdatePathwayScore,
  deletePathwayScore as apiDeletePathwayScore,
  ListPathwayScoresParams,
} from '@/modules/nexotype/service/user/pathway-score.service';

/**
 * PathwayScore store state interface
 */
export interface PathwayScoreState {
  // State
  pathwayScores: PathwayScore[];
  activePathwayScoreId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPathwayScores: (params?: ListPathwayScoresParams) => Promise<boolean>;
  fetchPathwayScore: (id: number) => Promise<PathwayScore | null>;
  createPathwayScore: (data: CreatePathwayScore) => Promise<boolean>;
  updatePathwayScore: (id: number, data: UpdatePathwayScore) => Promise<boolean>;
  deletePathwayScore: (id: number) => Promise<boolean>;
  setActivePathwayScore: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create pathway score store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePathwayScoreStore = create<PathwayScoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        pathwayScores: [],
        activePathwayScoreId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize pathway scores state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPathwayScores();

            if (response.success && response.data) {
              set((state) => {
                state.pathwayScores = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize pathway scores',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize pathway scores',
            });
          }
        },

        /**
         * Fetch all pathway scores with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchPathwayScores: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPathwayScores(params);

            if (response.success && response.data) {
              set((state) => {
                state.pathwayScores = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch pathway scores',
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
         * Fetch a specific pathway score by ID
         * @param id PathwayScore ID
         * @returns Promise with pathway score or null
         */
        fetchPathwayScore: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPathwayScore(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch pathway score with ID ${id}`,
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
         * Create a new pathway score
         * @param data PathwayScore creation data
         * @returns Success status
         */
        createPathwayScore: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreatePathwayScore(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchPathwayScores();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create pathway score',
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
         * Update an existing pathway score
         * @param id PathwayScore ID
         * @param data PathwayScore update data
         * @returns Success status
         */
        updatePathwayScore: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdatePathwayScore(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchPathwayScores();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update pathway score with ID ${id}`,
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
         * Delete a pathway score
         * @param id PathwayScore ID
         * @returns Success status
         */
        deletePathwayScore: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeletePathwayScore(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchPathwayScores();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete pathway score with ID ${id}`,
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
         * Set active pathway score
         * @param id ID of the active pathway score or null
         */
        setActivePathwayScore: (id) => {
          set((state) => {
            state.activePathwayScoreId = id;
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
            pathwayScores: [],
            activePathwayScoreId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-pathway-score-storage',
        partialize: (state) => ({
          activePathwayScoreId: state.activePathwayScoreId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get pathway score by ID from store
 * @param id PathwayScore ID
 * @returns The pathway score or undefined if not found
 */
export const getPathwayScoreById = (id: number): PathwayScore | undefined => {
  const { pathwayScores } = usePathwayScoreStore.getState();
  return pathwayScores.find((ps) => ps.id === id);
};

/**
 * Get active pathway score from store
 * @returns The active pathway score or undefined if not set
 */
export const getActivePathwayScore = (): PathwayScore | undefined => {
  const { pathwayScores, activePathwayScoreId } = usePathwayScoreStore.getState();
  return pathwayScores.find((ps) => ps.id === activePathwayScoreId);
};
