'use client';

import { useContext } from 'react';
import {
  DesignMutationContext,
  DesignMutationContextType,
} from '@/modules/nexotype/providers/engineering/design-mutation-provider';
import { useDesignMutationStore } from '@/modules/nexotype/store/engineering/design-mutation.store';
import {
  type DesignMutation,
  type CreateDesignMutation,
  type UpdateDesignMutation,
} from '@/modules/nexotype/schemas/engineering/design-mutation.schemas';
import { ListDesignMutationsParams } from '@/modules/nexotype/service/engineering/design-mutation.service';

/**
 * Hook to use the design mutation context
 * @throws Error if used outside of a DesignMutationProvider
 */
export function useDesignMutationContext(): DesignMutationContextType {
  const context = useContext(DesignMutationContext);

  if (!context) {
    throw new Error('useDesignMutationContext must be used within a DesignMutationProvider');
  }

  return context;
}

/**
 * Custom hook that combines design mutation context and store
 * to provide a simplified interface for design mutation functionality
 *
 * @returns DesignMutation utilities and state
 */
export function useDesignMutations() {
  // Get data from design mutation context
  const {
    designMutations,
    activeDesignMutationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDesignMutation,
    clearError: clearContextError,
  } = useDesignMutationContext();

  // Get additional actions from design mutation store
  const {
    fetchDesignMutations,
    fetchDesignMutation,
    createDesignMutation,
    updateDesignMutation,
    deleteDesignMutation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDesignMutationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active design mutation
  const activeDesignMutation = designMutations.find(
    (item: DesignMutation) => item.id === activeDesignMutationId
  ) || null;

  return {
    // State
    designMutations,
    activeDesignMutationId,
    activeDesignMutation,
    isLoading,
    error,
    isInitialized,

    // DesignMutation actions
    fetchDesignMutations,
    fetchDesignMutation,
    createDesignMutation,
    updateDesignMutation,
    deleteDesignMutation,
    setActiveDesignMutation,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return designMutations.find((item: DesignMutation) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListDesignMutationsParams) => {
      return await fetchDesignMutations(filters);
    },
    createWithData: async (data: CreateDesignMutation) => {
      return await createDesignMutation(data);
    },
    updateWithData: async (id: number, data: UpdateDesignMutation) => {
      return await updateDesignMutation(id, data);
    },
  };
}

export default useDesignMutations;
