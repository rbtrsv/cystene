'use client';

import { useContext } from 'react';
import {
  UserProfileContext,
  UserProfileContextType,
} from '@/modules/nexotype/providers/user/user-profile-provider';
import { useUserProfileStore } from '@/modules/nexotype/store/user/user-profile.store';
import {
  type UserProfile,
  type CreateUserProfile,
  type UpdateUserProfile,
} from '@/modules/nexotype/schemas/user/user-profile.schemas';
import { ListUserProfilesParams } from '@/modules/nexotype/service/user/user-profile.service';

/**
 * Hook to use the user profile context
 * @throws Error if used outside of a UserProfileProvider
 */
export function useUserProfileContext(): UserProfileContextType {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }

  return context;
}

/**
 * Custom hook that combines user profile context and store
 * to provide a simplified interface for user profile functionality
 *
 * @returns User profile utilities and state
 */
export function useUserProfiles() {
  // Get data from user profile context
  const {
    userProfiles,
    activeUserProfileId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveUserProfile,
    clearError: clearContextError,
  } = useUserProfileContext();

  // Get additional actions from user profile store
  const {
    fetchUserProfiles,
    fetchUserProfile,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useUserProfileStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active user profile
  const activeUserProfile = userProfiles.find((item: UserProfile) => item.id === activeUserProfileId) || null;

  return {
    // State
    userProfiles,
    activeUserProfileId,
    activeUserProfile,
    isLoading,
    error,
    isInitialized,

    // UserProfile actions
    fetchUserProfiles,
    fetchUserProfile,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
    setActiveUserProfile,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return userProfiles.find((item: UserProfile) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListUserProfilesParams) => {
      return await fetchUserProfiles(filters);
    },
    createWithData: async (data: CreateUserProfile) => {
      return await createUserProfile(data);
    },
    updateWithData: async (id: number, data: UpdateUserProfile) => {
      return await updateUserProfile(id, data);
    },
  };
}

export default useUserProfiles;
