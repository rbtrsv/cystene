'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TherapeuticEfficacy,
  CreateTherapeuticEfficacy,
  UpdateTherapeuticEfficacy,
} from '@/modules/nexotype/schemas/knowledge_graph/therapeutic-efficacy.schemas';
import {
  getTherapeuticEfficacies,
  getTherapeuticEfficacy,
  createTherapeuticEfficacy as apiCreateTherapeuticEfficacy,
  updateTherapeuticEfficacy as apiUpdateTherapeuticEfficacy,
  deleteTherapeuticEfficacy as apiDeleteTherapeuticEfficacy,
  ListTherapeuticEfficaciesParams,
} from '@/modules/nexotype/service/knowledge_graph/therapeutic-efficacy.service';

/**
 * TherapeuticEfficacy store state interface
 */
export interface TherapeuticEfficacyState {
  // State
  therapeuticEfficacies: TherapeuticEfficacy[];
  activeTherapeuticEfficacyId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTherapeuticEfficacies: (params?: ListTherapeuticEfficaciesParams) => Promise<boolean>;
  fetchTherapeuticEfficacy: (id: number) => Promise<TherapeuticEfficacy | null>;
  createTherapeuticEfficacy: (data: CreateTherapeuticEfficacy) => Promise<boolean>;
  updateTherapeuticEfficacy: (id: number, data: UpdateTherapeuticEfficacy) => Promise<boolean>;
  deleteTherapeuticEfficacy: (id: number) => Promise<boolean>;
  setActiveTherapeuticEfficacy: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create therapeutic efficacy store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTherapeuticEfficacyStore = create<TherapeuticEfficacyState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        therapeuticEfficacies: [],
        activeTherapeuticEfficacyId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize therapeutic efficacies state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticEfficacies();

            if (response.success && response.data) {
              set((state) => {
                state.therapeuticEfficacies = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize therapeutic efficacies',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize therapeutic efficacies',
            });
          }
        },

        /**
         * Fetch all therapeutic efficacies with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchTherapeuticEfficacies: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticEfficacies(params);

            if (response.success && response.data) {
              set((state) => {
                state.therapeuticEfficacies = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch therapeutic efficacies',
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
         * Fetch a specific therapeutic efficacy by ID
         * @param id TherapeuticEfficacy ID
         * @returns Promise with therapeutic efficacy or null
         */
        fetchTherapeuticEfficacy: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getTherapeuticEfficacy(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch therapeutic efficacy with ID ${id}`,
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
         * Create a new therapeutic efficacy
         * @param data TherapeuticEfficacy creation data
         * @returns Success status
         */
        createTherapeuticEfficacy: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateTherapeuticEfficacy(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchTherapeuticEfficacies();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create therapeutic efficacy',
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
         * Update an existing therapeutic efficacy
         * @param id TherapeuticEfficacy ID
         * @param data TherapeuticEfficacy update data
         * @returns Success status
         */
        updateTherapeuticEfficacy: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateTherapeuticEfficacy(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchTherapeuticEfficacies();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update therapeutic efficacy with ID ${id}`,
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
         * Delete a therapeutic efficacy
         * @param id TherapeuticEfficacy ID
         * @returns Success status
         */
        deleteTherapeuticEfficacy: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteTherapeuticEfficacy(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchTherapeuticEfficacies();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete therapeutic efficacy with ID ${id}`,
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
         * Set active therapeutic efficacy
         * @param id ID of the active therapeutic efficacy or null
         */
        setActiveTherapeuticEfficacy: (id) => {
          set((state) => {
            state.activeTherapeuticEfficacyId = id;
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
            therapeuticEfficacies: [],
            activeTherapeuticEfficacyId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-therapeutic-efficacy-storage',
        partialize: (state) => ({
          activeTherapeuticEfficacyId: state.activeTherapeuticEfficacyId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get therapeutic efficacy by ID from store
 * @param id TherapeuticEfficacy ID
 * @returns The therapeutic efficacy or undefined if not found
 */
export const getTherapeuticEfficacyById = (id: number): TherapeuticEfficacy | undefined => {
  const { therapeuticEfficacies } = useTherapeuticEfficacyStore.getState();
  return therapeuticEfficacies.find((te) => te.id === id);
};

/**
 * Get active therapeutic efficacy from store
 * @returns The active therapeutic efficacy or undefined if not set
 */
export const getActiveTherapeuticEfficacy = (): TherapeuticEfficacy | undefined => {
  const { therapeuticEfficacies, activeTherapeuticEfficacyId } = useTherapeuticEfficacyStore.getState();
  return therapeuticEfficacies.find((te) => te.id === activeTherapeuticEfficacyId);
};
