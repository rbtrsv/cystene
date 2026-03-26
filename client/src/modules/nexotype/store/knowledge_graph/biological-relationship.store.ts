'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  BiologicalRelationship,
  CreateBiologicalRelationship,
  UpdateBiologicalRelationship,
} from '@/modules/nexotype/schemas/knowledge_graph/biological-relationship.schemas';
import {
  getBiologicalRelationships,
  getBiologicalRelationship,
  createBiologicalRelationship as apiCreateBiologicalRelationship,
  updateBiologicalRelationship as apiUpdateBiologicalRelationship,
  deleteBiologicalRelationship as apiDeleteBiologicalRelationship,
  ListBiologicalRelationshipsParams,
} from '@/modules/nexotype/service/knowledge_graph/biological-relationship.service';

// Zustand state + action contract for this entity.
export interface BiologicalRelationshipState {
  // State
  biologicalRelationships: BiologicalRelationship[];
  activeBiologicalRelationshipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBiologicalRelationships: (params?: ListBiologicalRelationshipsParams) => Promise<boolean>;
  fetchBiologicalRelationship: (id: number) => Promise<BiologicalRelationship | null>;
  createBiologicalRelationship: (data: CreateBiologicalRelationship) => Promise<boolean>;
  updateBiologicalRelationship: (id: number, data: UpdateBiologicalRelationship) => Promise<boolean>;
  deleteBiologicalRelationship: (id: number) => Promise<boolean>;
  setActiveBiologicalRelationship: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store implementation used by provider + hook layers.
export const useBiologicalRelationshipStore = create<BiologicalRelationshipState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      biologicalRelationships: [],
      activeBiologicalRelationshipId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Bootstrap initial list state for first-load screens.
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await getBiologicalRelationships();
          if (response.success && response.data) {
            set((state) => {
              state.biologicalRelationships = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize biological relationships',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize biological relationships',
          });
        }
      },

      // Load list data with optional filters.
      fetchBiologicalRelationships: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getBiologicalRelationships(params);
          if (response.success && response.data) {
            set((state) => {
              state.biologicalRelationships = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch biological relationships',
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
      fetchBiologicalRelationship: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getBiologicalRelationship(id);
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch biological relationship with ID ${id}`,
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
      createBiologicalRelationship: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCreateBiologicalRelationship(data);
          if (response.success && response.data) {
            await get().fetchBiologicalRelationships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create biological relationship',
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
      updateBiologicalRelationship: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiUpdateBiologicalRelationship(id, data);
          if (response.success && response.data) {
            await get().fetchBiologicalRelationships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update biological relationship with ID ${id}`,
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
      deleteBiologicalRelationship: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiDeleteBiologicalRelationship(id);
          if (response.success) {
            await get().fetchBiologicalRelationships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete biological relationship with ID ${id}`,
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

      setActiveBiologicalRelationship: (id) => {
        set((state) => {
          state.activeBiologicalRelationshipId = id;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          biologicalRelationships: [],
          activeBiologicalRelationshipId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-biological-relationship-storage',
        partialize: (state) => ({
          activeBiologicalRelationshipId: state.activeBiologicalRelationshipId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get biological relationship by ID from store
 * @param id BiologicalRelationship ID
 * @returns The biological relationship or undefined if not found
 */
export const getBiologicalRelationshipById = (id: number): BiologicalRelationship | undefined => {
  const { biologicalRelationships } = useBiologicalRelationshipStore.getState();
  return biologicalRelationships.find((biologicalRelationship) => biologicalRelationship.id === id);
};

/**
 * Get active biological relationship from store
 * @returns The active biological relationship or undefined if not set
 */
export const getActiveBiologicalRelationship = (): BiologicalRelationship | undefined => {
  const { biologicalRelationships, activeBiologicalRelationshipId } = useBiologicalRelationshipStore.getState();
  return biologicalRelationships.find((biologicalRelationship) => biologicalRelationship.id === activeBiologicalRelationshipId);
};
