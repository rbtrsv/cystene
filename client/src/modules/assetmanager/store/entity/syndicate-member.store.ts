'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SyndicateMember,
  CreateSyndicateMember,
  UpdateSyndicateMember,
} from '../../schemas/entity/syndicate-member.schemas';
import {
  getSyndicateMembers,
  getSyndicateMember,
  createSyndicateMember as apiCreateSyndicateMember,
  updateSyndicateMember as apiUpdateSyndicateMember,
  deleteSyndicateMember as apiDeleteSyndicateMember,
  ListSyndicateMembersParams
} from '../../service/entity/syndicate-member.service';

/**
 * Syndicate Members store state interface
 */
export interface SyndicateMembersState {
  // State
  members: SyndicateMember[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListSyndicateMembersParams) => Promise<void>;
  fetchMembers: (params?: ListSyndicateMembersParams) => Promise<boolean>;
  fetchMember: (id: number) => Promise<SyndicateMember | null>;
  createMember: (data: CreateSyndicateMember) => Promise<boolean>;
  updateMember: (id: number, data: UpdateSyndicateMember) => Promise<boolean>;
  deleteMember: (id: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create syndicate members store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useSyndicateMembersStore = create<SyndicateMembersState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      members: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize syndicate members state
       */
      initialize: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateMembers(params);

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
              error: response.error || 'Failed to initialize syndicate members'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize syndicate members'
          });
        }
      },

      /**
       * Fetch all syndicate members with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchMembers: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateMembers(params);

          if (response.success && response.data) {
            set((state) => {
              state.members = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch syndicate members'
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
       * Fetch a specific syndicate member by ID
       * @param id Syndicate member ID
       * @returns Promise with member or null
       */
      fetchMember: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSyndicateMember(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch syndicate member with ID ${id}`
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
       * Create a new syndicate member
       * @param data Syndicate member creation data
       * @returns Success status
       */
      createMember: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateSyndicateMember(data);

          if (response.success && response.data) {
            // After creating, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create syndicate member'
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
       * Update an existing syndicate member
       * @param id Syndicate member ID
       * @param data Syndicate member update data
       * @returns Success status
       */
      updateMember: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateSyndicateMember(id, data);

          if (response.success && response.data) {
            // After updating, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update syndicate member with ID ${id}`
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
       * Delete a syndicate member
       * @param id Syndicate member ID
       * @returns Success status
       */
      deleteMember: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSyndicateMember(id);

          if (response.success) {
            // After deleting, refresh members list
            await get().fetchMembers();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete syndicate member with ID ${id}`
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
      name: 'finpy-syndicate-members-store'
    }
  )
);

/**
 * Helper function to get syndicate member by ID from store
 * @param id Syndicate member ID
 * @returns The member or undefined if not found
 */
export const getSyndicateMemberById = (id: number): SyndicateMember | undefined => {
  const { members } = useSyndicateMembersStore.getState();
  return members.find((member) => member.id === id);
};
