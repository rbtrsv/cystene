'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Subject,
  CreateSubject,
  UpdateSubject,
} from '@/modules/nexotype/schemas/lims/subject.schemas';
import {
  getSubjects,
  getSubject,
  createSubject as apiCreateSubject,
  updateSubject as apiUpdateSubject,
  deleteSubject as apiDeleteSubject,
  ListSubjectsParams,
} from '@/modules/nexotype/service/lims/subject.service';

/**
 * Subject store state interface
 */
export interface SubjectState {
  // State
  subjects: Subject[];
  activeSubjectId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSubjects: (params?: ListSubjectsParams) => Promise<boolean>;
  fetchSubject: (id: number) => Promise<Subject | null>;
  createSubject: (data: CreateSubject) => Promise<boolean>;
  updateSubject: (id: number, data: UpdateSubject) => Promise<boolean>;
  deleteSubject: (id: number) => Promise<boolean>;
  setActiveSubject: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create subject store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSubjectStore = create<SubjectState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        subjects: [],
        activeSubjectId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize subjects state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getSubjects();

            if (response.success && response.data) {
              set((state) => {
                state.subjects = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize subjects',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize subjects',
            });
          }
        },

        /**
         * Fetch all subjects with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchSubjects: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getSubjects(params);

            if (response.success && response.data) {
              set((state) => {
                state.subjects = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch subjects',
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
         * Fetch a specific subject by ID
         * @param id Subject ID
         * @returns Promise with subject or null
         */
        fetchSubject: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getSubject(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch subject with ID ${id}`,
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
         * Create a new subject
         * @param data Subject creation data
         * @returns Success status
         */
        createSubject: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateSubject(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchSubjects();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create subject',
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
         * Update an existing subject
         * @param id Subject ID
         * @param data Subject update data
         * @returns Success status
         */
        updateSubject: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateSubject(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchSubjects();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update subject with ID ${id}`,
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
         * Delete a subject
         * @param id Subject ID
         * @returns Success status
         */
        deleteSubject: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteSubject(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchSubjects();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete subject with ID ${id}`,
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
         * Set active subject
         * @param id ID of the active subject or null
         */
        setActiveSubject: (id) => {
          set((state) => {
            state.activeSubjectId = id;
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
            subjects: [],
            activeSubjectId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-subject-storage',
        partialize: (state) => ({
          activeSubjectId: state.activeSubjectId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get subject by ID from store
 * @param id Subject ID
 * @returns The subject or undefined if not found
 */
export const getSubjectById = (id: number): Subject | undefined => {
  const { subjects } = useSubjectStore.getState();
  return subjects.find((s) => s.id === id);
};

/**
 * Get active subject from store
 * @returns The active subject or undefined if not set
 */
export const getActiveSubject = (): Subject | undefined => {
  const { subjects, activeSubjectId } = useSubjectStore.getState();
  return subjects.find((s) => s.id === activeSubjectId);
};
