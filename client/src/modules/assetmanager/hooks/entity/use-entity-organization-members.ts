'use client';

import { useContext } from 'react';
import { EntityOrganizationMembersContext, EntityOrganizationMembersContextType } from '../../providers/entity/entity-organization-members-provider';
import { useEntityOrganizationMembersStore } from '../../store/entity/entity-organization-members.store';
import {
  type EntityOrganizationMember,
  type CreateEntityOrganizationMember,
  type UpdateEntityOrganizationMember
} from '../../schemas/entity/entity-organization-members.schema';
import { ListEntityOrganizationMembersParams } from '../../service/entity/entity-organization-members.service';

/**
 * Hook to use the entity organization members context
 * @throws Error if used outside of an EntityOrganizationMembersProvider
 */
export function useEntityOrganizationMembersContext(): EntityOrganizationMembersContextType {
  const context = useContext(EntityOrganizationMembersContext);

  if (!context) {
    throw new Error('useEntityOrganizationMembersContext must be used within an EntityOrganizationMembersProvider');
  }

  return context;
}

/**
 * Custom hook that combines entity organization members context and store
 * to provide a simplified interface for entity organization member functionality
 *
 * @returns Entity organization member utilities and state
 */
export function useEntityOrganizationMembers() {
  // Get data from entity organization members context
  const {
    members,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useEntityOrganizationMembersContext();

  // Get additional actions from entity organization members store
  const {
    fetchMembers,
    fetchMember,
    createMember,
    updateMember,
    deleteMember,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useEntityOrganizationMembersStore();

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
    members,
    isLoading,
    error,
    isInitialized,

    // Member actions
    fetchMembers,
    fetchMember,
    createMember,
    updateMember,
    deleteMember,
    initialize,
    clearError,

    // Helper methods
    hasMembers: members.length > 0,
    getMemberCount: () => members.length,
    getMemberById: (id: number) => {
      return members.find((member: EntityOrganizationMember) => member.id === id);
    },
    getMembersByEntity: (entityId: number) => {
      return members.filter((member: EntityOrganizationMember) => member.entity_id === entityId);
    },
    getMembersByOrganization: (organizationId: number) => {
      return members.filter((member: EntityOrganizationMember) => member.organization_id === organizationId);
    },
    getMembersByRole: (role: string) => {
      return members.filter((member: EntityOrganizationMember) => member.role === role);
    },

    // Convenience wrapper functions
    fetchMembersWithFilters: async (filters: ListEntityOrganizationMembersParams) => {
      return await fetchMembers(filters);
    },
    createMemberWithData: async (data: CreateEntityOrganizationMember) => {
      return await createMember(data);
    },
    updateMemberRole: async (id: number, role: string) => {
      const updateData: UpdateEntityOrganizationMember = { role };
      return await updateMember(id, updateData);
    }
  };
}

export default useEntityOrganizationMembers;
