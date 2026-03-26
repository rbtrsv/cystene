'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Recommendation,
  CreateRecommendation,
  UpdateRecommendation,
} from '@/modules/nexotype/schemas/user/recommendation.schemas';
import {
  getRecommendations,
  getRecommendation,
  createRecommendation as apiCreateRecommendation,
  updateRecommendation as apiUpdateRecommendation,
  deleteRecommendation as apiDeleteRecommendation,
  ListRecommendationsParams,
} from '@/modules/nexotype/service/user/recommendation.service';

/**
 * Recommendation store state interface
 */
export interface RecommendationState {
  // State
  recommendations: Recommendation[];
  activeRecommendationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchRecommendations: (params?: ListRecommendationsParams) => Promise<boolean>;
  fetchRecommendation: (id: number) => Promise<Recommendation | null>;
  createRecommendation: (data: CreateRecommendation) => Promise<boolean>;
  updateRecommendation: (id: number, data: UpdateRecommendation) => Promise<boolean>;
  deleteRecommendation: (id: number) => Promise<boolean>;
  setActiveRecommendation: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create recommendation store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useRecommendationStore = create<RecommendationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        recommendations: [],
        activeRecommendationId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize recommendations state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRecommendations();

            if (response.success && response.data) {
              set((state) => {
                state.recommendations = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize recommendations',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize recommendations',
            });
          }
        },

        /**
         * Fetch all recommendations with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchRecommendations: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRecommendations(params);

            if (response.success && response.data) {
              set((state) => {
                state.recommendations = response.data || [];
                state.isLoading = false;
              });
              return true;
            }
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch recommendations',
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
         * Fetch a specific recommendation by ID
         * @param id Recommendation ID
         * @returns Promise with recommendation or null
         */
        fetchRecommendation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getRecommendation(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch recommendation with ID ${id}`,
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
         * Create a new recommendation
         * @param data Recommendation creation data
         * @returns Success status
         */
        createRecommendation: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateRecommendation(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchRecommendations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create recommendation',
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
         * Update an existing recommendation
         * @param id Recommendation ID
         * @param data Recommendation update data
         * @returns Success status
         */
        updateRecommendation: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateRecommendation(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchRecommendations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update recommendation with ID ${id}`,
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
         * Delete a recommendation
         * @param id Recommendation ID
         * @returns Success status
         */
        deleteRecommendation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteRecommendation(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchRecommendations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete recommendation with ID ${id}`,
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
         * Set active recommendation
         * @param id ID of the active recommendation or null
         */
        setActiveRecommendation: (id) =>
          set((state) => {
            state.activeRecommendationId = id;
          }),

        /**
         * Clear error message
         */
        clearError: () => set({ error: null }),

        /**
         * Reset state to initial values
         */
        reset: () =>
          set({
            recommendations: [],
            activeRecommendationId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          }),
      })),
      {
        name: 'nexotype-recommendation-storage',
        partialize: (state) => ({
          activeRecommendationId: state.activeRecommendationId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get recommendation by ID from store
 * @param id Recommendation ID
 * @returns The recommendation or undefined if not found
 */
export const getRecommendationById = (id: number): Recommendation | undefined => {
  const { recommendations } = useRecommendationStore.getState();
  return recommendations.find((r) => r.id === id);
};

/**
 * Get active recommendation from store
 * @returns The active recommendation or undefined if not set
 */
export const getActiveRecommendation = (): Recommendation | undefined => {
  const { recommendations, activeRecommendationId } = useRecommendationStore.getState();
  return recommendations.find((r) => r.id === activeRecommendationId);
};
