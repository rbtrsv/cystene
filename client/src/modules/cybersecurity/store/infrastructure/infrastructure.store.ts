'use client';

/**
 * Infrastructure Store
 *
 * Zustand store for Infrastructure model.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/infrastructure_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Infrastructure,
  CreateInfrastructure,
  UpdateInfrastructure,
} from '../../schemas/infrastructure/infrastructure.schemas';
import {
  getInfrastructures,
  getInfrastructure,
  createInfrastructure as apiCreateInfrastructure,
  updateInfrastructure as apiUpdateInfrastructure,
  deleteInfrastructure as apiDeleteInfrastructure,
  ListInfrastructureParams,
} from '../../service/infrastructure/infrastructure.service';

/**
 * Infrastructure store state interface
 */
export interface InfrastructureState {
  // State
  infrastructures: Infrastructure[];
  activeInfrastructureId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchInfrastructures: (params?: ListInfrastructureParams) => Promise<boolean>;
  fetchInfrastructure: (id: number) => Promise<Infrastructure | null>;
  createInfrastructure: (data: CreateInfrastructure) => Promise<boolean>;
  updateInfrastructure: (id: number, data: UpdateInfrastructure) => Promise<boolean>;
  deleteInfrastructure: (id: number) => Promise<boolean>;
  setActiveInfrastructure: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create infrastructure store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useInfrastructureStore = create<InfrastructureState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      infrastructures: [],
      activeInfrastructureId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize infrastructure state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getInfrastructures();

          if (response.success && response.data) {
            set((state) => {
              state.infrastructures = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active infrastructure if not already set and items exist
              if (response.data && response.data.length > 0 && state.activeInfrastructureId === null) {
                state.activeInfrastructureId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize infrastructure'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize infrastructure'
          });
        }
      },

      /**
       * Fetch all infrastructure items with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchInfrastructures: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getInfrastructures(params);

          if (response.success && response.data) {
            set((state) => {
              state.infrastructures = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch infrastructure'
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
       * Fetch a specific infrastructure item by ID
       * @param id Infrastructure ID
       * @returns Promise with infrastructure or null
       */
      fetchInfrastructure: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getInfrastructure(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch infrastructure with ID ${id}`
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
       * Create a new infrastructure item
       * @param data Infrastructure creation data
       * @returns Success status
       */
      createInfrastructure: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateInfrastructure(data);

          if (response.success && response.data) {
            // After creating, refresh infrastructure list
            await get().fetchInfrastructures();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create infrastructure'
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
       * Update an existing infrastructure item
       * @param id Infrastructure ID
       * @param data Infrastructure update data
       * @returns Success status
       */
      updateInfrastructure: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateInfrastructure(id, data);

          if (response.success && response.data) {
            // After updating, refresh infrastructure list
            await get().fetchInfrastructures();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update infrastructure with ID ${id}`
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
       * Delete an infrastructure item
       * @param id Infrastructure ID
       * @returns Success status
       */
      deleteInfrastructure: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteInfrastructure(id);

          if (response.success) {
            // After deleting, refresh infrastructure list
            await get().fetchInfrastructures();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete infrastructure with ID ${id}`
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
       * Set active infrastructure
       * @param id ID of the active infrastructure or null
       */
      setActiveInfrastructure: (id) => {
        set((state) => {
          state.activeInfrastructureId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset infrastructure state to initial values
       */
      reset: () => {
        set({
          infrastructures: [],
          activeInfrastructureId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-infrastructure-storage',
        partialize: (state) => ({
          activeInfrastructureId: state.activeInfrastructureId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get infrastructure by ID from store
 * @param id Infrastructure ID
 * @returns The infrastructure or undefined if not found
 */
export const getInfrastructureById = (id: number): Infrastructure | undefined => {
  const { infrastructures } = useInfrastructureStore.getState();
  return infrastructures.find((item) => item.id === id);
};

/**
 * Get active infrastructure from store
 * @returns The active infrastructure or undefined if not set
 */
export const getActiveInfrastructure = (): Infrastructure | undefined => {
  const { infrastructures, activeInfrastructureId } = useInfrastructureStore.getState();
  return infrastructures.find((item) => item.id === activeInfrastructureId);
};
