'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PatentAssignee,
  CreatePatentAssignee,
  UpdatePatentAssignee,
} from '@/modules/nexotype/schemas/commercial/patent-assignee.schemas';
import {
  getPatentAssignees,
  getPatentAssignee,
  createPatentAssignee as apiCreatePatentAssignee,
  updatePatentAssignee as apiUpdatePatentAssignee,
  deletePatentAssignee as apiDeletePatentAssignee,
  ListPatentAssigneesParams,
} from '@/modules/nexotype/service/commercial/patent-assignee.service';

/**
 * PatentAssignee store state interface
 */
export interface PatentAssigneeState {
  // State
  patentAssignees: PatentAssignee[];
  activePatentAssigneeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPatentAssignees: (params?: ListPatentAssigneesParams) => Promise<boolean>;
  fetchPatentAssignee: (id: number) => Promise<PatentAssignee | null>;
  createPatentAssignee: (data: CreatePatentAssignee) => Promise<boolean>;
  updatePatentAssignee: (id: number, data: UpdatePatentAssignee) => Promise<boolean>;
  deletePatentAssignee: (id: number) => Promise<boolean>;
  setActivePatentAssignee: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create patent assignee store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePatentAssigneeStore = create<PatentAssigneeState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        patentAssignees: [],
        activePatentAssigneeId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize patent assignees state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentAssignees();

            if (response.success && response.data) {
              set((state) => {
                state.patentAssignees = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize patent assignees',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize patent assignees',
            });
          }
        },

        /**
         * Fetch all patent assignees with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchPatentAssignees: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentAssignees(params);

            if (response.success && response.data) {
              set((state) => {
                state.patentAssignees = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch patent assignees',
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
         * Fetch a specific patent assignee by ID
         * @param id PatentAssignee ID
         * @returns Promise with patent assignee or null
         */
        fetchPatentAssignee: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getPatentAssignee(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch patent assignee with ID ${id}`,
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
         * Create a new patent assignee
         * @param data PatentAssignee creation data
         * @returns Success status
         */
        createPatentAssignee: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreatePatentAssignee(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchPatentAssignees();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create patent assignee',
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
         * Update an existing patent assignee
         * @param id PatentAssignee ID
         * @param data PatentAssignee update data
         * @returns Success status
         */
        updatePatentAssignee: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdatePatentAssignee(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchPatentAssignees();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update patent assignee with ID ${id}`,
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
         * Delete a patent assignee
         * @param id PatentAssignee ID
         * @returns Success status
         */
        deletePatentAssignee: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeletePatentAssignee(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchPatentAssignees();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete patent assignee with ID ${id}`,
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
         * Set active patent assignee
         * @param id ID of the active patent assignee or null
         */
        setActivePatentAssignee: (id) => {
          set((state) => {
            state.activePatentAssigneeId = id;
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
            patentAssignees: [],
            activePatentAssigneeId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-patent-assignee-storage',
        partialize: (state) => ({
          activePatentAssigneeId: state.activePatentAssigneeId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get patent assignee by ID from store
 * @param id PatentAssignee ID
 * @returns The patent assignee or undefined if not found
 */
export const getPatentAssigneeById = (id: number): PatentAssignee | undefined => {
  const { patentAssignees } = usePatentAssigneeStore.getState();
  return patentAssignees.find((pa) => pa.id === id);
};

/**
 * Get active patent assignee from store
 * @returns The active patent assignee or undefined if not set
 */
export const getActivePatentAssignee = (): PatentAssignee | undefined => {
  const { patentAssignees, activePatentAssigneeId } = usePatentAssigneeStore.getState();
  return patentAssignees.find((pa) => pa.id === activePatentAssigneeId);
};
