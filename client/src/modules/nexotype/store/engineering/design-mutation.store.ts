'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DesignMutation,
  CreateDesignMutation,
  UpdateDesignMutation,
} from '@/modules/nexotype/schemas/engineering/design-mutation.schemas';
import {
  getDesignMutations,
  getDesignMutation,
  createDesignMutation as apiCreateDesignMutation,
  updateDesignMutation as apiUpdateDesignMutation,
  deleteDesignMutation as apiDeleteDesignMutation,
  ListDesignMutationsParams,
} from '@/modules/nexotype/service/engineering/design-mutation.service';

/**
 * DesignMutation store state interface
 */
export interface DesignMutationState {
  // State
  designMutations: DesignMutation[];
  activeDesignMutationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDesignMutations: (params?: ListDesignMutationsParams) => Promise<boolean>;
  fetchDesignMutation: (id: number) => Promise<DesignMutation | null>;
  createDesignMutation: (data: CreateDesignMutation) => Promise<boolean>;
  updateDesignMutation: (id: number, data: UpdateDesignMutation) => Promise<boolean>;
  deleteDesignMutation: (id: number) => Promise<boolean>;
  setActiveDesignMutation: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create design mutation store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDesignMutationStore = create<DesignMutationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        designMutations: [],
        activeDesignMutationId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize design mutations state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDesignMutations();

            if (response.success && response.data) {
              set((state) => {
                state.designMutations = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize design mutations',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize design mutations',
            });
          }
        },

        /**
         * Fetch all design mutations with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchDesignMutations: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDesignMutations(params);

            if (response.success && response.data) {
              set((state) => {
                state.designMutations = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch design mutations',
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
         * Fetch a specific design mutation by ID
         * @param id DesignMutation ID
         * @returns Promise with design mutation or null
         */
        fetchDesignMutation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDesignMutation(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch design mutation with ID ${id}`,
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
         * Create a new design mutation
         * @param data DesignMutation creation data
         * @returns Success status
         */
        createDesignMutation: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateDesignMutation(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchDesignMutations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create design mutation',
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
         * Update an existing design mutation
         * @param id DesignMutation ID
         * @param data DesignMutation update data
         * @returns Success status
         */
        updateDesignMutation: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateDesignMutation(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchDesignMutations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update design mutation with ID ${id}`,
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
         * Delete a design mutation
         * @param id DesignMutation ID
         * @returns Success status
         */
        deleteDesignMutation: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteDesignMutation(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchDesignMutations();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete design mutation with ID ${id}`,
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
         * Set active design mutation
         * @param id ID of the active design mutation or null
         */
        setActiveDesignMutation: (id) => {
          set((state) => {
            state.activeDesignMutationId = id;
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
            designMutations: [],
            activeDesignMutationId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-design-mutation-storage',
        partialize: (state) => ({
          activeDesignMutationId: state.activeDesignMutationId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get design mutation by ID from store
 * @param id DesignMutation ID
 * @returns The design mutation or undefined if not found
 */
export const getDesignMutationById = (id: number): DesignMutation | undefined => {
  const { designMutations } = useDesignMutationStore.getState();
  return designMutations.find((designMutation) => designMutation.id === id);
};

/**
 * Get active design mutation from store
 * @returns The active design mutation or undefined if not set
 */
export const getActiveDesignMutation = (): DesignMutation | undefined => {
  const { designMutations, activeDesignMutationId } = useDesignMutationStore.getState();
  return designMutations.find((designMutation) => designMutation.id === activeDesignMutationId);
};
