'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EntityOrganizationMember,
  CreateEntityOrganizationMember,
  UpdateEntityOrganizationMember,
} from '../../schemas/entity/entity-organization-members.schema';
import {
  getEntityOrganizationMembers,
  getEntityOrganizationMember,
  createEntityOrganizationMember as apiCreateEntityOrganizationMember,
  updateEntityOrganizationMember as apiUpdateEntityOrganizationMember,
  deleteEntityOrganizationMember as apiDeleteEntityOrganizationMember,
  ListEntityOrganizationMembersParams
} from '../../service/entity/entity-organization-members.service';

/**
 * Entity Organization Members store state interface
 */
export interface EntityOrganizationMembersState {
  // State
  members: EntityOrganizationMember[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListEntityOrganizationMembersParams) => Promise<void>;
  fetchMembers: (params?: ListEntityOrganizationMembersParams) => Promise<boolean>;
  fetchMember: (id: number) => Promise<EntityOrganizationMember | null>;
  createMember: (data: CreateEntityOrganizationMember) => Promise<boolean>;
  updateMember: (id: number, data: UpdateEntityOrganizationMember) => Promise<boolean>;
  deleteMember: (id: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create entity organization members store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useEntityOrganizationMembersStore = create<EntityOrganizationMembersState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      members: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize entity organization members state
       */
      initialize: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationMembers(params);

          if (response.success && response.data) {
            set((state) => {
              state.members = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize entity organization members'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize entity organization members'
          });
        }
      },

      /**
       * Fetch all entity organization members with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchMembers: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationMembers(params);

          if (response.success && response.data) {
            set((state) => {
              state.members = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch entity organization members'
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
       * Fetch a specific entity organization member by ID
       * @param id Entity organization member ID
       * @returns Promise with member or null
       */
      fetchMember: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationMember(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch entity organization member with ID ${id}`
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
       * Create a new entity organization member
       * @param data Entity organization member creation data
       * @returns Success status
       */
      createMember: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateEntityOrganizationMember(data);

          if (response.success && response.data) {
            // After creating, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create entity organization member'
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
       * Update an existing entity organization member
       * @param id Entity organization member ID
       * @param data Entity organization member update data
       * @returns Success status
       */
      updateMember: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateEntityOrganizationMember(id, data);

          if (response.success && response.data) {
            // After updating, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update entity organization member with ID ${id}`
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
       * Delete an entity organization member
       * @param id Entity organization member ID
       * @returns Success status
       */
      deleteMember: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteEntityOrganizationMember(id);

          if (response.success) {
            // After deleting, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete entity organization member with ID ${id}`
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
          members: [],
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
    {
      name: 'finpy-entity-organization-members-store'
    }
  )
);

/**
 * Helper function to get member by ID from store
 * @param id Member ID
 * @returns The member or undefined if not found
 */
export const getEntityOrganizationMemberById = (id: number): EntityOrganizationMember | undefined => {
  const { members } = useEntityOrganizationMembersStore.getState();
  return members.find((member) => member.id === id);
};
