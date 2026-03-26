'use client';

import { useContext } from 'react';
import { UserTreatmentLogContext, UserTreatmentLogContextType } from '@/modules/nexotype/providers/user/user-treatment-log-provider';
import { useUserTreatmentLogStore } from '@/modules/nexotype/store/user/user-treatment-log.store';
import {
  type UserTreatmentLog,
  type CreateUserTreatmentLog,
  type UpdateUserTreatmentLog,
} from '@/modules/nexotype/schemas/user/user-treatment-log.schemas';
import { ListUserTreatmentLogsParams } from '@/modules/nexotype/service/user/user-treatment-log.service';

/**
 * Hook to use the user treatment log context
 * @throws Error if used outside of a UserTreatmentLogProvider
 */
export function useUserTreatmentLogContext(): UserTreatmentLogContextType {
  const context = useContext(UserTreatmentLogContext);

  if (!context) {
    throw new Error('useUserTreatmentLogContext must be used within a UserTreatmentLogProvider');
  }

  return context;
}

/**
 * Custom hook that combines user treatment log context and store
 * to provide a simplified interface for user treatment log functionality
 *
 * @returns User treatment log utilities and state
 */
export function useUserTreatmentLogs() {
  // Get data from user treatment log context
  const {
    userTreatmentLogs,
    activeUserTreatmentLogId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveUserTreatmentLog,
    clearError: clearContextError,
  } = useUserTreatmentLogContext();

  // Get additional actions from user treatment log store
  const {
    fetchUserTreatmentLogs,
    fetchUserTreatmentLog,
    createUserTreatmentLog,
    updateUserTreatmentLog,
    deleteUserTreatmentLog,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useUserTreatmentLogStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active user treatment log
  const activeUserTreatmentLog = userTreatmentLogs.find((item: UserTreatmentLog) => item.id === activeUserTreatmentLogId) || null;

  return {
    // State
    userTreatmentLogs,
    activeUserTreatmentLogId,
    activeUserTreatmentLog,
    isLoading,
    error,
    isInitialized,

    // UserTreatmentLog actions
    fetchUserTreatmentLogs,
    fetchUserTreatmentLog,
    createUserTreatmentLog,
    updateUserTreatmentLog,
    deleteUserTreatmentLog,
    setActiveUserTreatmentLog,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return userTreatmentLogs.find((item: UserTreatmentLog) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListUserTreatmentLogsParams) => {
      return await fetchUserTreatmentLogs(filters);
    },
    createWithData: async (data: CreateUserTreatmentLog) => {
      return await createUserTreatmentLog(data);
    },
    updateWithData: async (id: number, data: UpdateUserTreatmentLog) => {
      return await updateUserTreatmentLog(id, data);
    },
  };
}

export default useUserTreatmentLogs;
