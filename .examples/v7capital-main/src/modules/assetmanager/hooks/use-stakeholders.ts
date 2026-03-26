'use client';

import { useStakeholdersContext } from '../providers/stakeholders-provider';
import { useStakeholdersStore } from '../store/stakeholders.store';
import {
  type Stakeholder,
  type StakeholderWithUsers,
  type StakeholderUserWithProfile,
  type StakeholderRole
} from '../schemas/stakeholders.schemas';

/**
 * Custom hook that combines stakeholder context and store
 * to provide a simplified interface for stakeholder functionality
 * 
 * @returns Stakeholder utilities and state
 */
export function useStakeholders() {
  // Get data from stakeholder context
  const {
    stakeholders,
    selectedStakeholder,
    stakeholderUsers,
    isLoading: contextLoading,
    error: contextError,
    fetchStakeholders,
    fetchStakeholder,
    setSelectedStakeholder,
    clearError: clearContextError
  } = useStakeholdersContext();

  // Get additional actions from stakeholder store
  const {
    addStakeholder,
    editStakeholder,
    removeStakeholder,
    fetchStakeholderUsers,
    addUserToStakeholder,
    updateUserRole,
    removeUserFromStakeholder,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useStakeholdersStore();

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
    stakeholders,
    selectedStakeholder,
    stakeholderUsers,
    isLoading,
    error,
    
    // Stakeholder actions
    fetchStakeholders,
    fetchStakeholder,
    addStakeholder,
    editStakeholder,
    removeStakeholder,
    setSelectedStakeholder,
    
    // Stakeholder user actions
    fetchStakeholderUsers,
    addUserToStakeholder,
    updateUserRole,
    removeUserFromStakeholder,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasStakeholders: () => stakeholders.length > 0,
    getStakeholderById: (id: number) => stakeholders.find(s => s.id === id),
    getStakeholderName: (id: number) => {
      const stakeholder = stakeholders.find(s => s.id === id);
      return stakeholder ? stakeholder.stakeholderName : 'Unknown Stakeholder';
    },
    getUserRole: (stakeholderId: number, userProfileId: number): StakeholderRole | null => {
      // If we have the selected stakeholder and it matches the requested ID
      if (selectedStakeholder && selectedStakeholder.id === stakeholderId) {
        const user = selectedStakeholder.users?.find(u => u.userProfileId === userProfileId);
        return user ? user.role : null;
      }
      
      // Otherwise, check the stakeholderUsers array
      const user = stakeholderUsers.find(
        u => u.stakeholderId === stakeholderId && u.userProfileId === userProfileId
      );
      return user ? user.role : null;
    },
    isUserInStakeholder: (stakeholderId: number, userProfileId: number): boolean => {
      // If we have the selected stakeholder and it matches the requested ID
      if (selectedStakeholder && selectedStakeholder.id === stakeholderId) {
        return selectedStakeholder.users?.some(u => u.userProfileId === userProfileId) || false;
      }
      
      // Otherwise, check the stakeholderUsers array
      return stakeholderUsers.some(
        u => u.stakeholderId === stakeholderId && u.userProfileId === userProfileId
      );
    }
  };
}

export default useStakeholders;
