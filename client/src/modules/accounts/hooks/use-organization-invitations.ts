'use client';

import { useContext } from 'react';
import { OrganizationInvitationsContext, OrganizationInvitationsContextType } from '../providers/organization-invitations-provider';
import { useOrganizationInvitationsStore } from '../store/organization-invitations.store';
import {
  type InvitationDetail,
  type InvitationCreate,
  type InvitationStatus
} from '../schemas/organization-invitations.schema';

/**
 * Hook to use the organization invitations context
 * @throws Error if used outside of an OrganizationInvitationsProvider
 */
export function useOrganizationInvitationsContext(): OrganizationInvitationsContextType {
  const context = useContext(OrganizationInvitationsContext);

  if (!context) {
    throw new Error('useOrganizationInvitationsContext must be used within an OrganizationInvitationsProvider');
  }

  return context;
}

/**
 * Custom hook that combines organization invitations context and store
 * to provide a simplified interface for organization invitation functionality
 *
 * @returns Organization invitation utilities and state
 */
export function useOrganizationInvitations() {
  // Get data from organization invitations context
  const {
    invitations,
    myInvitations,
    activeOrganizationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError: clearContextError
  } = useOrganizationInvitationsContext();

  // Get additional actions from organization invitations store
  const {
    fetchInvitations,
    fetchMyInvitations,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useOrganizationInvitationsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    invitations,
    myInvitations,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,

    // Invitation actions
    fetchInvitations,
    fetchMyInvitations,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    setActiveOrganization,
    initialize,
    clearError,

    // Helper methods
    hasInvitations: invitations.length > 0,
    hasMyInvitations: myInvitations.length > 0,
    getInvitationCount: () => invitations.length,
    getMyInvitationCount: () => myInvitations.length,
    getInvitationById: (id: number) => {
      return invitations.find((invitation: InvitationDetail) => invitation.id === id);
    },
    getInvitationsByStatus: (status: InvitationStatus) => {
      return invitations.filter((invitation: InvitationDetail) => invitation.status === status);
    },
    getPendingInvitations: () => {
      return invitations.filter((invitation: InvitationDetail) => invitation.status === 'PENDING');
    },
    getAcceptedInvitations: () => {
      return invitations.filter((invitation: InvitationDetail) => invitation.status === 'ACCEPTED');
    },
    getRejectedInvitations: () => {
      return invitations.filter((invitation: InvitationDetail) => invitation.status === 'REJECTED');
    },
    getCancelledInvitations: () => {
      return invitations.filter((invitation: InvitationDetail) => invitation.status === 'CANCELLED');
    },

    // Convenience wrapper functions
    createInvitationWithData: async (email: string, organizationId: number, role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' = 'VIEWER') => {
      const data: InvitationCreate = { email, organization_id: organizationId, role };
      return await createInvitation(data);
    }
  };
}

export default useOrganizationInvitations;
