'use client';

import { useContext } from 'react';
import { UserBiomarkerReadingContext, UserBiomarkerReadingContextType } from '@/modules/nexotype/providers/user/user-biomarker-reading-provider';
import { useUserBiomarkerReadingStore } from '@/modules/nexotype/store/user/user-biomarker-reading.store';
import {
  type UserBiomarkerReading,
  type CreateUserBiomarkerReading,
  type UpdateUserBiomarkerReading,
} from '@/modules/nexotype/schemas/user/user-biomarker-reading.schemas';
import { ListUserBiomarkerReadingsParams } from '@/modules/nexotype/service/user/user-biomarker-reading.service';

/**
 * Hook to use the user biomarker reading context
 * @throws Error if used outside of a UserBiomarkerReadingProvider
 */
export function useUserBiomarkerReadingContext(): UserBiomarkerReadingContextType {
  const context = useContext(UserBiomarkerReadingContext);

  if (!context) {
    throw new Error('useUserBiomarkerReadingContext must be used within a UserBiomarkerReadingProvider');
  }

  return context;
}

/**
 * Custom hook that combines user biomarker reading context and store
 * to provide a simplified interface for user biomarker reading functionality
 *
 * @returns User biomarker reading utilities and state
 */
export function useUserBiomarkerReadings() {
  // Get data from user biomarker reading context
  const {
    userBiomarkerReadings,
    activeUserBiomarkerReadingId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveUserBiomarkerReading,
    clearError: clearContextError,
  } = useUserBiomarkerReadingContext();

  // Get additional actions from user biomarker reading store
  const {
    fetchUserBiomarkerReadings,
    fetchUserBiomarkerReading,
    createUserBiomarkerReading,
    updateUserBiomarkerReading,
    deleteUserBiomarkerReading,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useUserBiomarkerReadingStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active user biomarker reading
  const activeUserBiomarkerReading = userBiomarkerReadings.find((item: UserBiomarkerReading) => item.id === activeUserBiomarkerReadingId) || null;

  return {
    // State
    userBiomarkerReadings,
    activeUserBiomarkerReadingId,
    activeUserBiomarkerReading,
    isLoading,
    error,
    isInitialized,

    // UserBiomarkerReading actions
    fetchUserBiomarkerReadings,
    fetchUserBiomarkerReading,
    createUserBiomarkerReading,
    updateUserBiomarkerReading,
    deleteUserBiomarkerReading,
    setActiveUserBiomarkerReading,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return userBiomarkerReadings.find((item: UserBiomarkerReading) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListUserBiomarkerReadingsParams) => {
      return await fetchUserBiomarkerReadings(filters);
    },
    createWithData: async (data: CreateUserBiomarkerReading) => {
      return await createUserBiomarkerReading(data);
    },
    updateWithData: async (id: number, data: UpdateUserBiomarkerReading) => {
      return await updateUserBiomarkerReading(id, data);
    },
  };
}

export default useUserBiomarkerReadings;
