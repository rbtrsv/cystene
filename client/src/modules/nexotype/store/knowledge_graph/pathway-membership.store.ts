'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  PathwayMembership,
  CreatePathwayMembership,
  UpdatePathwayMembership,
} from '@/modules/nexotype/schemas/knowledge_graph/pathway-membership.schemas';
import {
  getPathwayMemberships,
  getPathwayMembership,
  createPathwayMembership as apiCreatePathwayMembership,
  updatePathwayMembership as apiUpdatePathwayMembership,
  deletePathwayMembership as apiDeletePathwayMembership,
  ListPathwayMembershipsParams,
} from '@/modules/nexotype/service/knowledge_graph/pathway-membership.service';

// Zustand state + action contract for this entity.
export interface PathwayMembershipState {
  // State
  pathwayMemberships: PathwayMembership[];
  activePathwayMembershipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchPathwayMemberships: (params?: ListPathwayMembershipsParams) => Promise<boolean>;
  fetchPathwayMembership: (id: number) => Promise<PathwayMembership | null>;
  createPathwayMembership: (data: CreatePathwayMembership) => Promise<boolean>;
  updatePathwayMembership: (id: number, data: UpdatePathwayMembership) => Promise<boolean>;
  deletePathwayMembership: (id: number) => Promise<boolean>;
  setActivePathwayMembership: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store implementation used by provider + hook layers.
export const usePathwayMembershipStore = create<PathwayMembershipState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      pathwayMemberships: [],
      activePathwayMembershipId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Bootstrap initial list state for first-load screens.
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await getPathwayMemberships();
          if (response.success && response.data) {
            set((state) => {
              state.pathwayMemberships = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize pathway memberships',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize pathway memberships',
          });
        }
      },

      // Load list data with optional filters.
      fetchPathwayMemberships: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getPathwayMemberships(params);
          if (response.success && response.data) {
            set((state) => {
              state.pathwayMemberships = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch pathway memberships',
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
      fetchPathwayMembership: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getPathwayMembership(id);
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch pathway membership with ID ${id}`,
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
      createPathwayMembership: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCreatePathwayMembership(data);
          if (response.success && response.data) {
            await get().fetchPathwayMemberships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create pathway membership',
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
      updatePathwayMembership: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiUpdatePathwayMembership(id, data);
          if (response.success && response.data) {
            await get().fetchPathwayMemberships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update pathway membership with ID ${id}`,
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
      deletePathwayMembership: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiDeletePathwayMembership(id);
          if (response.success) {
            await get().fetchPathwayMemberships();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete pathway membership with ID ${id}`,
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

      setActivePathwayMembership: (id) => {
        set((state) => {
          state.activePathwayMembershipId = id;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          pathwayMemberships: [],
          activePathwayMembershipId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-pathway-membership-storage',
        partialize: (state) => ({
          activePathwayMembershipId: state.activePathwayMembershipId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get pathway membership by ID from store
 * @param id PathwayMembership ID
 * @returns The pathway membership or undefined if not found
 */
export const getPathwayMembershipById = (id: number): PathwayMembership | undefined => {
  const { pathwayMemberships } = usePathwayMembershipStore.getState();
  return pathwayMemberships.find((pathwayMembership) => pathwayMembership.id === id);
};

/**
 * Get active pathway membership from store
 * @returns The active pathway membership or undefined if not set
 */
export const getActivePathwayMembership = (): PathwayMembership | undefined => {
  const { pathwayMemberships, activePathwayMembershipId } = usePathwayMembershipStore.getState();
  return pathwayMemberships.find((pathwayMembership) => pathwayMembership.id === activePathwayMembershipId);
};
