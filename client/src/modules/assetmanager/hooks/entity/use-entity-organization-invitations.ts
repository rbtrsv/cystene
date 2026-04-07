'use client';

import { useContext } from 'react';
import { EntityOrganizationInvitationsContext, EntityOrganizationInvitationsContextType } from '../../providers/entity/entity-organization-invitations-provider';
import { useEntityOrganizationInvitationsStore } from '../../store/entity/entity-organization-invitations.store';
import {
  type EntityOrganizationInvitation,
  type CreateEntityOrganizationInvitation,
  type UpdateEntityOrganizationInvitation,
  type InvitationStatus
} from '../../schemas/entity/entity-organization-invitations.schema';
import { ListEntityOrganizationInvitationsParams } from '../../service/entity/entity-organization-invitations.service';

/**
 * Hook to use the entity organization invitations context
 * @throws Error if used outside of an EntityOrganizationInvitationsProvider
 */
export function useEntityOrganizationInvitationsContext(): EntityOrganizationInvitationsContextType {
  const context = useContext(EntityOrganizationInvitationsContext);

  if (!context) {
    throw new Error('useEntityOrganizationInvitationsContext must be used within an EntityOrganizationInvitationsProvider');
  }

  return context;
}

/**
 * Custom hook that combines entity organization invitations context and store
 * to provide a simplified interface for entity organization invitation functionality
 *
 * @returns Entity organization invitation utilities and state
 */
export function useEntityOrganizationInvitations() {
  // Get data from entity organization invitations context
  const {
    invitations,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useEntityOrganizationInvitationsContext();

  // Get additional actions from entity organization invitations store
  const {
    fetchInvitations,
    fetchInvitation,
    createInvitation,
    updateInvitation,
    acceptInvitation,
    rejectInvitation,
    requestAccess,
    deleteInvitation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useEntityOrganizationInvitationsStore();

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
    isLoading,
    error,
    isInitialized,

    // Invitation actions
    fetchInvitations,
    fetchInvitation,
    createInvitation,
    updateInvitation,
    acceptInvitation,
    rejectInvitation,
    requestAccess,
    deleteInvitation,
    initialize,
    clearError,

    // Helper methods
    hasInvitations: invitations.length > 0,
    getInvitationCount: () => invitations.length,
    getInvitationById: (id: number) => {
      return invitations.find((invitation: EntityOrganizationInvitation) => invitation.id === id);
    },
    getInvitationsByEntity: (entityId: number) => {
      return invitations.filter((invitation: EntityOrganizationInvitation) => invitation.entity_id === entityId);
    },
    getInvitationsByOrganization: (organizationId: number) => {
      return invitations.filter((invitation: EntityOrganizationInvitation) => invitation.organization_id === organizationId);
    },
    getInvitationsByStatus: (status: InvitationStatus) => {
      return invitations.filter((invitation: EntityOrganizationInvitation) => invitation.status === status);
    },
    getPendingInvitations: () => {
      return invitations.filter((invitation: EntityOrganizationInvitation) => invitation.status === 'PENDING');
    },
    getAcceptedInvitations: () => {
      return invitations.filter((invitation: EntityOrganizationInvitation) => invitation.status === 'ACCEPTED');
    },

    // Convenience wrapper functions
    fetchInvitationsWithFilters: async (filters: ListEntityOrganizationInvitationsParams) => {
      return await fetchInvitations(filters);
    },
    createInvitationWithData: async (data: CreateEntityOrganizationInvitation) => {
      return await createInvitation(data);
    },
    updateInvitationRole: async (id: number, role: string) => {
      const updateData: UpdateEntityOrganizationInvitation = { role };
      return await updateInvitation(id, updateData);
    },
    updateInvitationStatus: async (id: number, status: string) => {
      const updateData: UpdateEntityOrganizationInvitation = { status };
      return await updateInvitation(id, updateData);
    }
  };
}

export default useEntityOrganizationInvitations;
