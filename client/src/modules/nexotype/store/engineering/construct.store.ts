'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Construct,
  CreateConstruct,
  UpdateConstruct,
} from '@/modules/nexotype/schemas/engineering/construct.schemas';
import {
  getConstructs,
  getConstruct,
  createConstruct as apiCreateConstruct,
  updateConstruct as apiUpdateConstruct,
  deleteConstruct as apiDeleteConstruct,
  ListConstructsParams,
} from '@/modules/nexotype/service/engineering/construct.service';

/**
 * Construct store state interface
 */
export interface ConstructState {
  // State
  constructs: Construct[];
  activeConstructId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchConstructs: (params?: ListConstructsParams) => Promise<boolean>;
  fetchConstruct: (id: number) => Promise<Construct | null>;
  createConstruct: (data: CreateConstruct) => Promise<boolean>;
  updateConstruct: (id: number, data: UpdateConstruct) => Promise<boolean>;
  deleteConstruct: (id: number) => Promise<boolean>;
  setActiveConstruct: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create construct store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useConstructStore = create<ConstructState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        constructs: [],
        activeConstructId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize constructs state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConstructs();

            if (response.success && response.data) {
              set((state) => {
                state.constructs = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize constructs',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize constructs',
            });
          }
        },

        /**
         * Fetch all constructs with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchConstructs: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConstructs(params);

            if (response.success && response.data) {
              set((state) => {
                state.constructs = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch constructs',
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
         * Fetch a specific construct by ID
         * @param id Construct ID
         * @returns Promise with construct or null
         */
        fetchConstruct: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getConstruct(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch construct with ID ${id}`,
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
         * Create a new construct
         * @param data Construct creation data
         * @returns Success status
         */
        createConstruct: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateConstruct(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchConstructs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create construct',
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
         * Update an existing construct
         * @param id Construct ID
         * @param data Construct update data
         * @returns Success status
         */
        updateConstruct: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateConstruct(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchConstructs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update construct with ID ${id}`,
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
         * Delete a construct
         * @param id Construct ID
         * @returns Success status
         */
        deleteConstruct: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteConstruct(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchConstructs();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete construct with ID ${id}`,
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
         * Set active construct
         * @param id ID of the active construct or null
         */
        setActiveConstruct: (id) => {
          set((state) => {
            state.activeConstructId = id;
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
            constructs: [],
            activeConstructId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-construct-storage',
        partialize: (state) => ({
          activeConstructId: state.activeConstructId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get construct by ID from store
 * @param id Construct ID
 * @returns The construct or undefined if not found
 */
export const getConstructById = (id: number): Construct | undefined => {
  const { constructs } = useConstructStore.getState();
  return constructs.find((construct) => construct.id === id);
};

/**
 * Get active construct from store
 * @returns The active construct or undefined if not set
 */
export const getActiveConstruct = (): Construct | undefined => {
  const { constructs, activeConstructId } = useConstructStore.getState();
  return constructs.find((construct) => construct.id === activeConstructId);
};
