'use client';

import { useContext } from 'react';
import { UserVariantContext, UserVariantContextType } from '@/modules/nexotype/providers/user/user-variant-provider';
import { useUserVariantStore } from '@/modules/nexotype/store/user/user-variant.store';
import {
  type UserVariant,
  type CreateUserVariant,
  type UpdateUserVariant,
} from '@/modules/nexotype/schemas/user/user-variant.schemas';
import { ListUserVariantsParams } from '@/modules/nexotype/service/user/user-variant.service';

/**
 * Hook to use the user variant context
 * @throws Error if used outside of a UserVariantProvider
 */
export function useUserVariantContext(): UserVariantContextType {
  const context = useContext(UserVariantContext);

  if (!context) {
    throw new Error('useUserVariantContext must be used within a UserVariantProvider');
  }

  return context;
}

/**
 * Custom hook that combines user variant context and store
 * to provide a simplified interface for user variant functionality
 *
 * @returns User variant utilities and state
 */
export function useUserVariants() {
  // Get data from user variant context
  const {
    userVariants,
    activeUserVariantId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveUserVariant,
    clearError: clearContextError,
  } = useUserVariantContext();

  // Get additional actions from user variant store
  const {
    fetchUserVariants,
    fetchUserVariant,
    createUserVariant,
    updateUserVariant,
    deleteUserVariant,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useUserVariantStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active user variant
  const activeUserVariant = userVariants.find((item: UserVariant) => item.id === activeUserVariantId) || null;

  return {
    // State
    userVariants,
    activeUserVariantId,
    activeUserVariant,
    isLoading,
    error,
    isInitialized,

    // UserVariant actions
    fetchUserVariants,
    fetchUserVariant,
    createUserVariant,
    updateUserVariant,
    deleteUserVariant,
    setActiveUserVariant,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return userVariants.find((item: UserVariant) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListUserVariantsParams) => {
      return await fetchUserVariants(filters);
    },
    createWithData: async (data: CreateUserVariant) => {
      return await createUserVariant(data);
    },
    updateWithData: async (id: number, data: UpdateUserVariant) => {
      return await updateUserVariant(id, data);
    },
  };
}

export default useUserVariants;
