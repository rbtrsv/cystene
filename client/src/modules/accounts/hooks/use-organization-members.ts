'use client';

import { useContext } from 'react';
import { OrganizationMembersContext, OrganizationMembersContextType } from '../providers/organization-members-provider';
import { useOrganizationMembersStore } from '../store/organization-members.store';
import {
  type MemberDetail,
  type MemberCreate,
  type MemberUpdate
} from '../schemas/organization-members.schema';

/**
 * Hook to use the organization members context
 * @throws Error if used outside of an OrganizationMembersProvider
 */
export function useOrganizationMembersContext(): OrganizationMembersContextType {
  const context = useContext(OrganizationMembersContext);
  
  if (!context) {
    throw new Error('useOrganizationMembersContext must be used within an OrganizationMembersProvider');
  }
  
  return context;
}

/**
 * Custom hook that combines organization members context and store
 * to provide a simplified interface for organization member functionality
 * 
 * @returns Organization member utilities and state
 */
export function useOrganizationMembers() {
  // Get data from organization members context
  const {
    members,
    activeOrganizationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError: clearContextError
  } = useOrganizationMembersContext();

  // Get additional actions from organization members store
  const {
    fetchMembers,
    fetchMember,
    addMember,
    updateMember,
    removeMember,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useOrganizationMembersStore();

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
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    
    // Member actions
    fetchMembers,
    fetchMember,
    addMember,
    updateMember,
    removeMember,
    setActiveOrganization,
    initialize,
    clearError,
    
    // Helper methods
    hasMembers: members.length > 0,
    getMemberCount: () => members.length,
    getMemberByEmail: (email: string) => {
      return members.find((member: MemberDetail) => member.email === email);
    },
    getMemberById: (id: number) => {
      return members.find((member: MemberDetail) => member.id === id);
    },
    getMembersByRole: (role: string) => {
      return members.filter((member: MemberDetail) => member.role === role);
    },
    
    // Convenience wrapper functions to maintain API compatibility
    addMemberWithData: async (organizationId: number, userId: number, role: string = 'VIEWER') => {
      const memberData: MemberCreate = { user_id: userId, role };
      return await addMember(organizationId, memberData);
    },
    
    updateMemberRole: async (organizationId: number, memberId: number, role: string) => {
      const updateData: MemberUpdate = { role };
      return await updateMember(organizationId, memberId, updateData);
    }
  };
}

export default useOrganizationMembers;