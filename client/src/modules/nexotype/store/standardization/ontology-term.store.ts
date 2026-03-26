'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  OntologyTerm,
  CreateOntologyTerm,
  UpdateOntologyTerm,
} from '@/modules/nexotype/schemas/standardization/ontology-term.schemas';
import {
  getOntologyTerms,
  getOntologyTerm,
  createOntologyTerm as apiCreateOntologyTerm,
  updateOntologyTerm as apiUpdateOntologyTerm,
  deleteOntologyTerm as apiDeleteOntologyTerm,
  ListOntologyTermsParams,
} from '@/modules/nexotype/service/standardization/ontology-term.service';

/**
 * Ontology term store state interface
 */
export interface OntologyTermState {
  // State
  ontologyTerms: OntologyTerm[];
  activeOntologyTermId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOntologyTerms: (params?: ListOntologyTermsParams) => Promise<boolean>;
  fetchOntologyTerm: (id: number) => Promise<OntologyTerm | null>;
  createOntologyTerm: (data: CreateOntologyTerm) => Promise<boolean>;
  updateOntologyTerm: (id: number, data: UpdateOntologyTerm) => Promise<boolean>;
  deleteOntologyTerm: (id: number) => Promise<boolean>;
  setActiveOntologyTerm: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create ontology term store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOntologyTermStore = create<OntologyTermState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      ontologyTerms: [],
      activeOntologyTermId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize ontology terms state
       */
      // Bootstrap initial list state for first-load screens.

      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOntologyTerms();

          if (response.success && response.data) {
            set((state) => {
              state.ontologyTerms = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize ontology terms',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize ontology terms',
          });
        }
      },

      /**
       * Fetch all ontology terms with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchOntologyTerms: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOntologyTerms(params);

          if (response.success && response.data) {
            set((state) => {
              state.ontologyTerms = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch ontology terms',
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
       * Fetch a specific ontology term by ID
       * @param id Ontology term ID
       * @returns Promise with ontology term or null
       */
      fetchOntologyTerm: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getOntologyTerm(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch ontology term with ID ${id}`,
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
       * Create a new ontology term
       * @param data Ontology term creation data
       * @returns Success status
       */
      // Create and refresh list so UI remains consistent.

      createOntologyTerm: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateOntologyTerm(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchOntologyTerms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create ontology term',
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
       * Update an existing ontology term
       * @param id Ontology term ID
       * @param data Ontology term update data
       * @returns Success status
       */
      updateOntologyTerm: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateOntologyTerm(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchOntologyTerms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update ontology term with ID ${id}`,
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
       * Delete an ontology term
       * @param id Ontology term ID
       * @returns Success status
       */
      // Soft-delete and refresh list so archived rows are hidden.

      deleteOntologyTerm: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteOntologyTerm(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchOntologyTerms();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete ontology term with ID ${id}`,
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
       * Set active ontology term
       * @param id ID of the active ontology term or null
       */
      setActiveOntologyTerm: (id) => {
        set((state) => {
          state.activeOntologyTermId = id;
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
          ontologyTerms: [],
          activeOntologyTermId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-ontology-term-storage',
        partialize: (state) => ({
          activeOntologyTermId: state.activeOntologyTermId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get ontology term by ID from store
 * @param id Ontology term ID
 * @returns The ontology term or undefined if not found
 */
export const getOntologyTermById = (id: number): OntologyTerm | undefined => {
  const { ontologyTerms } = useOntologyTermStore.getState();
  return ontologyTerms.find((ot) => ot.id === id);
};

/**
 * Get active ontology term from store
 * @returns The active ontology term or undefined if not set
 */
export const getActiveOntologyTerm = (): OntologyTerm | undefined => {
  const { ontologyTerms, activeOntologyTermId } = useOntologyTermStore.getState();
  return ontologyTerms.find((ot) => ot.id === activeOntologyTermId);
};
