'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Syndicate,
  CreateSyndicate,
  UpdateSyndicate,
} from '../../schemas/entity/syndicate.schemas';
import {
  getSyndicates,
  getSyndicate,
  createSyndicate as apiCreateSyndicate,
  updateSyndicate as apiUpdateSyndicate,
  deleteSyndicate as apiDeleteSyndicate,
  ListSyndicatesParams
} from '../../service/entity/syndicate.service';

/**
 * Syndicate store state interface
 */
export interface SyndicateState {
  // State
  syndicates: Syndicate[];
  activeSyndicateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSyndicates: (params?: ListSyndicatesParams) => Promise<boolean>;
  fetchSyndicate: (id: number) => Promise<Syndicate | null>;
  createSyndicate: (data: CreateSyndicate) => Promise<boolean>;
  updateSyndicate: (id: number, data: UpdateSyndicate) => Promise<boolean>;
  deleteSyndicate: (id: number) => Promise<boolean>;
  setActiveSyndicate: (syndicateId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create syndicate store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSyndicateStore = create<SyndicateState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      syndicates: [],
      activeSyndicateId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize syndicates state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicates();

          if (response.success && response.data) {
            set((state) => {
              state.syndicates = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active syndicate if not already set and syndicates exist
              if (response.data && response.data.length > 0 && state.activeSyndicateId === null) {
                state.activeSyndicateId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize syndicates'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize syndicates'
          });
        }
      },

      /**
       * Fetch all syndicates with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchSyndicates: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicates(params);

          if (response.success && response.data) {
            set((state) => {
              state.syndicates = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch syndicates'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Fetch a specific syndicate by ID
       * @param id Syndicate ID
       * @returns Promise with syndicate or null
       */
      fetchSyndicate: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicate(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch syndicate with ID ${id}`
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },

      /**
       * Create a new syndicate
       * @param data Syndicate creation data
       * @returns Success status
       */
      createSyndicate: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSyndicate(data);

          if (response.success && response.data) {
            // After creating, refresh syndicates list
            await get().fetchSyndicates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create syndicate'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Update an existing syndicate
       * @param id Syndicate ID
       * @param data Syndicate update data
       * @returns Success status
       */
      updateSyndicate: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSyndicate(id, data);

          if (response.success && response.data) {
            // After updating, refresh syndicates list
            await get().fetchSyndicates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update syndicate with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Delete a syndicate
       * @param id Syndicate ID
       * @returns Success status
       */
      deleteSyndicate: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSyndicate(id);

          if (response.success) {
            // After deleting, refresh syndicates list
            await get().fetchSyndicates();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete syndicate with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Set active syndicate
       * @param syndicateId ID of the active syndicate or null
       */
      setActiveSyndicate: (syndicateId) => {
        set((state) => {
          state.activeSyndicateId = syndicateId;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset syndicate state to initial values
       */
      reset: () => {
        set({
          syndicates: [],
          activeSyndicateId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'finpy-syndicate-storage',
        partialize: (state) => ({
          activeSyndicateId: state.activeSyndicateId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get syndicate by ID from store
 * @param id Syndicate ID
 * @returns The syndicate or undefined if not found
 */
export const getSyndicateById = (id: number): Syndicate | undefined => {
  const { syndicates } = useSyndicateStore.getState();
  return syndicates.find((syndicate) => syndicate.id === id);
};

/**
 * Get active syndicate from syndicate store
 * @returns The active syndicate or undefined if not set
 */
export const getActiveSyndicate = (): Syndicate | undefined => {
  const { syndicates, activeSyndicateId } = useSyndicateStore.getState();
  return syndicates.find((syndicate) => syndicate.id === activeSyndicateId);
};
