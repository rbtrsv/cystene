'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EvidenceAssertion,
  CreateEvidenceAssertion,
  UpdateEvidenceAssertion,
} from '@/modules/nexotype/schemas/knowledge_graph/evidence-assertion.schemas';
import {
  getEvidenceAssertions,
  getEvidenceAssertion,
  createEvidenceAssertion as apiCreateEvidenceAssertion,
  updateEvidenceAssertion as apiUpdateEvidenceAssertion,
  deleteEvidenceAssertion as apiDeleteEvidenceAssertion,
  ListEvidenceAssertionsParams,
} from '@/modules/nexotype/service/knowledge_graph/evidence-assertion.service';

// Zustand state + action contract for this entity.
export interface EvidenceAssertionState {
  // State
  evidenceAssertions: EvidenceAssertion[];
  activeEvidenceAssertionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchEvidenceAssertions: (params?: ListEvidenceAssertionsParams) => Promise<boolean>;
  fetchEvidenceAssertion: (id: number) => Promise<EvidenceAssertion | null>;
  createEvidenceAssertion: (data: CreateEvidenceAssertion) => Promise<boolean>;
  updateEvidenceAssertion: (id: number, data: UpdateEvidenceAssertion) => Promise<boolean>;
  deleteEvidenceAssertion: (id: number) => Promise<boolean>;
  setActiveEvidenceAssertion: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store implementation used by provider + hook layers.
export const useEvidenceAssertionStore = create<EvidenceAssertionState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      evidenceAssertions: [],
      activeEvidenceAssertionId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Bootstrap initial list state for first-load screens.
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await getEvidenceAssertions();
          if (response.success && response.data) {
            set((state) => {
              state.evidenceAssertions = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize evidence assertions',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize evidence assertions',
          });
        }
      },

      // Load list data with optional filters.
      fetchEvidenceAssertions: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getEvidenceAssertions(params);
          if (response.success && response.data) {
            set((state) => {
              state.evidenceAssertions = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch evidence assertions',
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

      // Load one record for details pages and deep-links.
      fetchEvidenceAssertion: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getEvidenceAssertion(id);
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch evidence assertion with ID ${id}`,
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

      // Create and refresh list so UI remains consistent.
      createEvidenceAssertion: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCreateEvidenceAssertion(data);
          if (response.success && response.data) {
            await get().fetchEvidenceAssertions();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create evidence assertion',
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

      // Update and refresh list so UI remains consistent.
      updateEvidenceAssertion: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiUpdateEvidenceAssertion(id, data);
          if (response.success && response.data) {
            await get().fetchEvidenceAssertions();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update evidence assertion with ID ${id}`,
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

      // Soft-delete and refresh list so archived rows are hidden.
      deleteEvidenceAssertion: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiDeleteEvidenceAssertion(id);
          if (response.success) {
            await get().fetchEvidenceAssertions();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete evidence assertion with ID ${id}`,
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

      setActiveEvidenceAssertion: (id) => {
        set((state) => {
          state.activeEvidenceAssertionId = id;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          evidenceAssertions: [],
          activeEvidenceAssertionId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-evidence-assertion-storage',
        partialize: (state) => ({
          activeEvidenceAssertionId: state.activeEvidenceAssertionId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get evidence assertion by ID from store
 * @param id EvidenceAssertion ID
 * @returns The evidence assertion or undefined if not found
 */
export const getEvidenceAssertionById = (id: number): EvidenceAssertion | undefined => {
  const { evidenceAssertions } = useEvidenceAssertionStore.getState();
  return evidenceAssertions.find((evidenceAssertion) => evidenceAssertion.id === id);
};

/**
 * Get active evidence assertion from store
 * @returns The active evidence assertion or undefined if not set
 */
export const getActiveEvidenceAssertion = (): EvidenceAssertion | undefined => {
  const { evidenceAssertions, activeEvidenceAssertionId } = useEvidenceAssertionStore.getState();
  return evidenceAssertions.find((evidenceAssertion) => evidenceAssertion.id === activeEvidenceAssertionId);
};
