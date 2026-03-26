'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Indication,
  CreateIndication,
  UpdateIndication,
} from '@/modules/nexotype/schemas/clinical/indication.schemas';
import {
  getIndications,
  getIndication,
  createIndication as apiCreateIndication,
  updateIndication as apiUpdateIndication,
  deleteIndication as apiDeleteIndication,
  ListIndicationsParams,
} from '@/modules/nexotype/service/clinical/indication.service';

/**
 * Indication store state interface
 */
export interface IndicationState {
  // State
  indications: Indication[];
  activeIndicationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchIndications: (params?: ListIndicationsParams) => Promise<boolean>;
  fetchIndication: (id: number) => Promise<Indication | null>;
  createIndication: (data: CreateIndication) => Promise<boolean>;
  updateIndication: (id: number, data: UpdateIndication) => Promise<boolean>;
  deleteIndication: (id: number) => Promise<boolean>;
  setActiveIndication: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create indication store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useIndicationStore = create<IndicationState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      indications: [],
      activeIndicationId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize indications state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIndications();

          if (response.success && response.data) {
            set((state) => {
              state.indications = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize indications',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize indications',
          });
        }
      },

      /**
       * Fetch all indications with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchIndications: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIndications(params);

          if (response.success && response.data) {
            set((state) => {
              state.indications = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch indications',
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
       * Fetch a specific indication by ID
       * @param id Indication ID
       * @returns Promise with indication or null
       */
      fetchIndication: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getIndication(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch indication with ID ${id}`,
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
       * Create a new indication
       * @param data Indication creation data
       * @returns Success status
       */
      createIndication: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateIndication(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchIndications();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create indication',
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
       * Update an existing indication
       * @param id Indication ID
       * @param data Indication update data
       * @returns Success status
       */
      updateIndication: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateIndication(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchIndications();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update indication with ID ${id}`,
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
       * Delete an indication
       * @param id Indication ID
       * @returns Success status
       */
      deleteIndication: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteIndication(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchIndications();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete indication with ID ${id}`,
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
       * Set active indication
       * @param id ID of the active indication or null
       */
      setActiveIndication: (id) => {
        set((state) => {
          state.activeIndicationId = id;
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
          indications: [],
          activeIndicationId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-indication-storage',
        partialize: (state) => ({
          activeIndicationId: state.activeIndicationId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get indication by ID from store
 * @param id Indication ID
 * @returns The indication or undefined if not found
 */
export const getIndicationById = (id: number): Indication | undefined => {
  const { indications } = useIndicationStore.getState();
  return indications.find((ind) => ind.id === id);
};

/**
 * Get active indication from store
 * @returns The active indication or undefined if not set
 */
export const getActiveIndication = (): Indication | undefined => {
  const { indications, activeIndicationId } = useIndicationStore.getState();
  return indications.find((ind) => ind.id === activeIndicationId);
};
