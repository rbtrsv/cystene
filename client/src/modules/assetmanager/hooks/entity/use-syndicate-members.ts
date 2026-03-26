'use client';

import { useContext } from 'react';
import { SyndicateMembersContext, SyndicateMembersContextType } from '../../providers/entity/syndicate-member-provider';
import { useSyndicateMembersStore } from '../../store/entity/syndicate-member.store';
import {
  type SyndicateMember,
  type CreateSyndicateMember,
  type UpdateSyndicateMember
} from '../../schemas/entity/syndicate-member.schemas';
import { ListSyndicateMembersParams } from '../../service/entity/syndicate-member.service';

/**
 * Hook to use the syndicate members context
 * @throws Error if used outside of a SyndicateMembersProvider
 */
export function useSyndicateMembersContext(): SyndicateMembersContextType {
  const context = useContext(SyndicateMembersContext);

  if (!context) {
    throw new Error('useSyndicateMembersContext must be used within a SyndicateMembersProvider');
  }

  return context;
}

/**
 * Custom hook that combines syndicate members context and store
 * to provide a simplified interface for syndicate member functionality
 *
 * @returns Syndicate member utilities and state
 */
export function useSyndicateMembers() {
  // Get data from syndicate members context
  const {
    members,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useSyndicateMembersContext();

  // Get additional actions from syndicate members store
  const {
    fetchMembers,
    fetchMember,
    createMember,
    updateMember,
    deleteMember,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSyndicateMembersStore();

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
      return members.find((member: SyndicateMember) => member.id === id);
    },
    getMembersBySyndicate: (syndicateId: number) => {
      return members.filter((member: SyndicateMember) => member.syndicate_id === syndicateId);
    },
    getMembersByEntity: (entityId: number) => {
      return members.filter((member: SyndicateMember) => member.member_entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchMembersWithFilters: async (filters: ListSyndicateMembersParams) => {
      return await fetchMembers(filters);
    },
    createMemberWithData: async (data: CreateSyndicateMember) => {
      return await createMember(data);
    },
    updateMemberData: async (id: number, data: UpdateSyndicateMember) => {
      return await updateMember(id, data);
    }
  };
}

export default useSyndicateMembers;
