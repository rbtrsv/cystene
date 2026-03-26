'use client';

import { useContext } from 'react';
import { ConstructContext, ConstructContextType } from '@/modules/nexotype/providers/engineering/construct-provider';
import { useConstructStore } from '@/modules/nexotype/store/engineering/construct.store';
import {
  type Construct,
  type CreateConstruct,
  type UpdateConstruct,
} from '@/modules/nexotype/schemas/engineering/construct.schemas';
import { ListConstructsParams } from '@/modules/nexotype/service/engineering/construct.service';

/**
 * Hook to use the construct context
 * @throws Error if used outside of a ConstructProvider
 */
export function useConstructContext(): ConstructContextType {
  const context = useContext(ConstructContext);

  if (!context) {
    throw new Error('useConstructContext must be used within a ConstructProvider');
  }

  return context;
}

/**
 * Custom hook that combines construct context and store
 * to provide a simplified interface for construct functionality
 *
 * @returns Construct utilities and state
 */
export function useConstructs() {
  // Get data from construct context
  const {
    constructs,
    activeConstructId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveConstruct,
    clearError: clearContextError,
  } = useConstructContext();

  // Get additional actions from construct store
  const {
    fetchConstructs,
    fetchConstruct,
    createConstruct,
    updateConstruct,
    deleteConstruct,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useConstructStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active construct
  const activeConstruct = constructs.find((item: Construct) => item.id === activeConstructId) || null;

  return {
    // State
    constructs,
    activeConstructId,
    activeConstruct,
    isLoading,
    error,
    isInitialized,

    // Construct actions
    fetchConstructs,
    fetchConstruct,
    createConstruct,
    updateConstruct,
    deleteConstruct,
    setActiveConstruct,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return constructs.find((item: Construct) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListConstructsParams) => {
      return await fetchConstructs(filters);
    },
    createWithData: async (data: CreateConstruct) => {
      return await createConstruct(data);
    },
    updateWithData: async (id: number, data: UpdateConstruct) => {
      return await updateConstruct(id, data);
    },
  };
}

export default useConstructs;
