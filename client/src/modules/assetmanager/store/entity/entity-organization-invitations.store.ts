'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EntityOrganizationInvitation,
  CreateEntityOrganizationInvitation,
  UpdateEntityOrganizationInvitation,
  RequestEntityAccess,
} from '../../schemas/entity/entity-organization-invitations.schema';
import {
  getEntityOrganizationInvitations,
  getEntityOrganizationInvitation,
  createEntityOrganizationInvitation as apiCreateEntityOrganizationInvitation,
  updateEntityOrganizationInvitation as apiUpdateEntityOrganizationInvitation,
  deleteEntityOrganizationInvitation as apiDeleteEntityOrganizationInvitation,
  acceptEntityOrganizationInvitation as apiAcceptEntityOrganizationInvitation,
  rejectEntityOrganizationInvitation as apiRejectEntityOrganizationInvitation,
  requestEntityAccess as apiRequestEntityAccess,
  ListEntityOrganizationInvitationsParams
} from '../../service/entity/entity-organization-invitations.service';

/**
 * Entity Organization Invitations store state interface
 */
export interface EntityOrganizationInvitationsState {
  // State
  invitations: EntityOrganizationInvitation[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListEntityOrganizationInvitationsParams) => Promise<void>;
  fetchInvitations: (params?: ListEntityOrganizationInvitationsParams) => Promise<boolean>;
  fetchInvitation: (id: number) => Promise<EntityOrganizationInvitation | null>;
  createInvitation: (data: CreateEntityOrganizationInvitation) => Promise<boolean>;
  updateInvitation: (id: number, data: UpdateEntityOrganizationInvitation) => Promise<boolean>;
  acceptInvitation: (id: number) => Promise<boolean>;
  rejectInvitation: (id: number) => Promise<boolean>;
  requestAccess: (data: RequestEntityAccess) => Promise<boolean>;
  deleteInvitation: (id: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create entity organization invitations store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useEntityOrganizationInvitationsStore = create<EntityOrganizationInvitationsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      invitations: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize entity organization invitations state
       */
      initialize: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationInvitations(params);

          if (response.success && response.data) {
            set((state) => {
              state.invitations = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize entity organization invitations'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize entity organization invitations'
          });
        }
      },

      /**
       * Fetch all entity organization invitations with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchInvitations: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationInvitations(params);

          if (response.success && response.data) {
            set((state) => {
              state.invitations = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch entity organization invitations'
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
       * Fetch a specific entity organization invitation by ID
       * @param id Entity organization invitation ID
       * @returns Promise with invitation or null
       */
      fetchInvitation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityOrganizationInvitation(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch entity organization invitation with ID ${id}`
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
       * Create a new entity organization invitation
       * @param data Entity organization invitation creation data
       * @returns Success status
       */
      createInvitation: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateEntityOrganizationInvitation(data);

          if (response.success && response.data) {
            // After creating, refresh invitations list
            await get().fetchInvitations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create entity organization invitation'
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
       * Update an existing entity organization invitation
       * @param id Entity organization invitation ID
       * @param data Entity organization invitation update data
       * @returns Success status
       */
      updateInvitation: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateEntityOrganizationInvitation(id, data);

          if (response.success && response.data) {
            // After updating, refresh invitations list
            await get().fetchInvitations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update entity organization invitation with ID ${id}`
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
       * Accept an entity organization invitation
       * @param id Entity organization invitation ID
       * @returns Success status
       */
      acceptInvitation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiAcceptEntityOrganizationInvitation(id);

          if (response.success && response.data) {
            // After accepting, refresh invitations list
            await get().fetchInvitations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to accept entity organization invitation with ID ${id}`
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
       * Reject an entity organization invitation
       * @param id Entity organization invitation ID
       * @returns Success status
       */
      rejectInvitation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRejectEntityOrganizationInvitation(id);

          if (response.success && response.data) {
            // After rejecting, refresh invitations list
            await get().fetchInvitations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to reject entity organization invitation with ID ${id}`
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
       * Request access to a discoverable entity (claim flow — reverse direction)
       * @param data Request entity access data (entity_id, organization_id)
       * @returns Success status
       */
      requestAccess: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRequestEntityAccess(data);

          if (response.success && response.data) {
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to request entity access'
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
       * Delete an entity organization invitation
       * @param id Entity organization invitation ID
       * @returns Success status
       */
      deleteInvitation: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteEntityOrganizationInvitation(id);

          if (response.success) {
            // After deleting, refresh invitations list
            await get().fetchInvitations();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete entity organization invitation with ID ${id}`
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
          invitations: [],
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
    {
      name: 'finpy-entity-organization-invitations-store'
    }
  )
);

/**
 * Helper function to get invitation by ID from store
 * @param id Invitation ID
 * @returns The invitation or undefined if not found
 */
export const getEntityOrganizationInvitationById = (id: number): EntityOrganizationInvitation | undefined => {
  const { invitations } = useEntityOrganizationInvitationsStore.getState();
  return invitations.find((invitation) => invitation.id === id);
};
