'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  InvitationDetail,
  InvitationCreate
} from '../schemas/organization-invitations.schema';
import {
  listInvitationsByOrganization,
  listMyInvitations,
  createInvitation as apiCreateInvitation,
  acceptInvitation as apiAcceptInvitation,
  rejectInvitation as apiRejectInvitation,
  cancelInvitation as apiCancelInvitation
} from '../service/organization-invitations.service';

/**
 * Organization Invitations store state interface
 */
export interface OrganizationInvitationsState {
  // State
  invitations: InvitationDetail[];
  myInvitations: InvitationDetail[];
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (organizationId: number) => Promise<void>;
  fetchInvitations: (organizationId: number) => Promise<boolean>;
  fetchMyInvitations: () => Promise<boolean>;
  createInvitation: (data: InvitationCreate) => Promise<boolean>;
  acceptInvitation: (invitationId: number) => Promise<boolean>;
  rejectInvitation: (invitationId: number) => Promise<boolean>;
  cancelInvitation: (invitationId: number) => Promise<boolean>;
  setActiveOrganization: (organizationId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create organization invitations store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOrganizationInvitationsStore = create<OrganizationInvitationsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      invitations: [],
      myInvitations: [],
      activeOrganizationId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize invitations state for an organization
       */
      initialize: async (organizationId: number) => {
        set({
          isLoading: true,
          error: null,
          activeOrganizationId: organizationId
        });

        try {
          const invitations = await listInvitationsByOrganization(organizationId);

          set((state) => {
            state.invitations = invitations;
            state.isInitialized = true;
            state.isLoading = false;
          });
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize invitations'
          });
        }
      },

      /**
       * Fetch all invitations for an organization
       * @param organizationId Organization ID
       * @returns Success status
       */
      fetchInvitations: async (organizationId: number) => {
        set({
          isLoading: true,
          error: null,
          activeOrganizationId: organizationId
        });

        try {
          const invitations = await listInvitationsByOrganization(organizationId);

          set((state) => {
            state.invitations = invitations;
            state.isLoading = false;
          });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Fetch all invitations for the current user
       * @returns Success status
       */
      fetchMyInvitations: async () => {
        set({ isLoading: true, error: null });

        try {
          const invitations = await listMyInvitations();

          set((state) => {
            state.myInvitations = invitations;
            state.isLoading = false;
          });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Create a new invitation
       * @param data Invitation creation data
       * @returns Success status
       */
      createInvitation: async (data: InvitationCreate) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateInvitation(data);

          if (response.success) {
            // After creating, refresh invitations list
            await get().fetchInvitations(data.organization_id);
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create invitation'
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
       * Accept an invitation
       * @param invitationId Invitation ID
       * @returns Success status
       */
      acceptInvitation: async (invitationId: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiAcceptInvitation(invitationId);

          if (response.success) {
            // After accepting, refresh my invitations list
            await get().fetchMyInvitations();
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to accept invitation'
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
       * Reject an invitation
       * @param invitationId Invitation ID
       * @returns Success status
       */
      rejectInvitation: async (invitationId: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRejectInvitation(invitationId);

          if (response.success) {
            // After rejecting, refresh my invitations list
            await get().fetchMyInvitations();
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to reject invitation'
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
       * Cancel an invitation
       * @param invitationId Invitation ID
       * @returns Success status
       */
      cancelInvitation: async (invitationId: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCancelInvitation(invitationId);

          if (response.success) {
            // After cancelling, refresh invitations list if we have an active org
            const activeOrg = get().activeOrganizationId;
            if (activeOrg) {
              await get().fetchInvitations(activeOrg);
            }
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to cancel invitation'
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
       * Set active organization
       * @param organizationId ID of the active organization or null
       */
      setActiveOrganization: (organizationId: number | null) => {
        set((state) => {
          state.activeOrganizationId = organizationId;
          // Clear invitations when switching organizations
          if (organizationId === null) {
            state.invitations = [];
            state.isInitialized = false;
          }
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset invitations state to initial values
       */
      reset: () => {
        set({
          invitations: [],
          myInvitations: [],
          activeOrganizationId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
    {
      name: 'nexotype-organization-invitations-store'
    }
  )
);

/**
 * Get invitation by ID from current invitations list
 * @param invitationId Invitation ID to find
 * @returns The invitation or undefined if not found
 */
export const getInvitationById = (invitationId: number): InvitationDetail | undefined => {
  const { invitations } = useOrganizationInvitationsStore.getState();
  return invitations.find((invitation) => invitation.id === invitationId);
};
