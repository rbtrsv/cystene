'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ExternalReference,
  CreateExternalReference,
  UpdateExternalReference,
} from '@/modules/nexotype/schemas/standardization/external-reference.schemas';
import {
  getExternalReferences,
  getExternalReference,
  createExternalReference as apiCreateExternalReference,
  updateExternalReference as apiUpdateExternalReference,
  deleteExternalReference as apiDeleteExternalReference,
  ListExternalReferencesParams,
} from '@/modules/nexotype/service/standardization/external-reference.service';

/**
 * External reference store state interface
 */
export interface ExternalReferenceState {
  // State
  externalReferences: ExternalReference[];
  activeExternalReferenceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchExternalReferences: (params?: ListExternalReferencesParams) => Promise<boolean>;
  fetchExternalReference: (id: number) => Promise<ExternalReference | null>;
  createExternalReference: (data: CreateExternalReference) => Promise<boolean>;
  updateExternalReference: (id: number, data: UpdateExternalReference) => Promise<boolean>;
  deleteExternalReference: (id: number) => Promise<boolean>;
  setActiveExternalReference: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create external reference store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useExternalReferenceStore = create<ExternalReferenceState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      externalReferences: [],
      activeExternalReferenceId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize external references state
       */
      // Bootstrap initial list state for first-load screens.

      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExternalReferences();

          if (response.success && response.data) {
            set((state) => {
              state.externalReferences = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize external references',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize external references',
          });
        }
      },

      /**
       * Fetch all external references with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchExternalReferences: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExternalReferences(params);

          if (response.success && response.data) {
            set((state) => {
              state.externalReferences = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch external references',
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
       * Fetch a specific external reference by ID
       * @param id External reference ID
       * @returns Promise with external reference or null
       */
      fetchExternalReference: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getExternalReference(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch external reference with ID ${id}`,
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
       * Create a new external reference
       * @param data External reference creation data
       * @returns Success status
       */
      // Create and refresh list so UI remains consistent.

      createExternalReference: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateExternalReference(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchExternalReferences();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create external reference',
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
       * Update an existing external reference
       * @param id External reference ID
       * @param data External reference update data
       * @returns Success status
       */
      updateExternalReference: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateExternalReference(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchExternalReferences();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update external reference with ID ${id}`,
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
       * Delete an external reference
       * @param id External reference ID
       * @returns Success status
       */
      // Soft-delete and refresh list so archived rows are hidden.

      deleteExternalReference: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteExternalReference(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchExternalReferences();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete external reference with ID ${id}`,
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
       * Set active external reference
       * @param id ID of the active external reference or null
       */
      setActiveExternalReference: (id) => {
        set((state) => {
          state.activeExternalReferenceId = id;
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
          externalReferences: [],
          activeExternalReferenceId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-external-reference-storage',
        partialize: (state) => ({
          activeExternalReferenceId: state.activeExternalReferenceId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get external reference by ID from store
 * @param id External reference ID
 * @returns The external reference or undefined if not found
 */
export const getExternalReferenceById = (id: number): ExternalReference | undefined => {
  const { externalReferences } = useExternalReferenceStore.getState();
  return externalReferences.find((er) => er.id === id);
};

/**
 * Get active external reference from store
 * @returns The active external reference or undefined if not set
 */
export const getActiveExternalReference = (): ExternalReference | undefined => {
  const { externalReferences, activeExternalReferenceId } = useExternalReferenceStore.getState();
  return externalReferences.find((er) => er.id === activeExternalReferenceId);
};
