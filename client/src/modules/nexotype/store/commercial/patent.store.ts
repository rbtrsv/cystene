'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Patent,
  CreatePatent,
  UpdatePatent,
} from '@/modules/nexotype/schemas/commercial/patent.schemas';
import {
  getPatents,
  getPatent,
  createPatent as apiCreatePatent,
  updatePatent as apiUpdatePatent,
  deletePatent as apiDeletePatent,
  ListPatentsParams,
} from '@/modules/nexotype/service/commercial/patent.service';

/**
 * Patent store state interface
 */
export interface PatentState {
  // State
  patents: Patent[];
  activePatentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPatents: (params?: ListPatentsParams) => Promise<boolean>;
  fetchPatent: (id: number) => Promise<Patent | null>;
  createPatent: (data: CreatePatent) => Promise<boolean>;
  updatePatent: (id: number, data: UpdatePatent) => Promise<boolean>;
  deletePatent: (id: number) => Promise<boolean>;
  setActivePatent: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create patent store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePatentStore = create<PatentState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      patents: [],
      activePatentId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize patents state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPatents();

          if (response.success && response.data) {
            set((state) => {
              state.patents = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize patents',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize patents',
          });
        }
      },

      /**
       * Fetch all patents with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchPatents: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPatents(params);

          if (response.success && response.data) {
            set((state) => {
              state.patents = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch patents',
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
       * Fetch a specific patent by ID
       * @param id Patent ID
       * @returns Promise with patent or null
       */
      fetchPatent: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPatent(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch patent with ID ${id}`,
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
       * Create a new patent
       * @param data Patent creation data
       * @returns Success status
       */
      createPatent: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreatePatent(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchPatents();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create patent',
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
       * Update an existing patent
       * @param id Patent ID
       * @param data Patent update data
       * @returns Success status
       */
      updatePatent: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdatePatent(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchPatents();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update patent with ID ${id}`,
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
       * Delete a patent
       * @param id Patent ID
       * @returns Success status
       */
      deletePatent: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeletePatent(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchPatents();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete patent with ID ${id}`,
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
       * Set active patent
       * @param id ID of the active patent or null
       */
      setActivePatent: (id) => {
        set((state) => {
          state.activePatentId = id;
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
          patents: [],
          activePatentId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-patent-storage',
        partialize: (state) => ({
          activePatentId: state.activePatentId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get patent by ID from store
 * @param id Patent ID
 * @returns The patent or undefined if not found
 */
export const getPatentById = (id: number): Patent | undefined => {
  const { patents } = usePatentStore.getState();
  return patents.find((patent) => patent.id === id);
};

/**
 * Get active patent from store
 * @returns The active patent or undefined if not set
 */
export const getActivePatent = (): Patent | undefined => {
  const { patents, activePatentId } = usePatentStore.getState();
  return patents.find((patent) => patent.id === activePatentId);
};
