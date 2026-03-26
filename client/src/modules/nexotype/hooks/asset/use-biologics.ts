'use client';

import { useContext } from 'react';
import { BiologicContext, BiologicContextType } from '@/modules/nexotype/providers/asset/biologic-provider';
import { useBiologicStore } from '@/modules/nexotype/store/asset/biologic.store';
import {
  type Biologic,
  type CreateBiologic,
  type UpdateBiologic,
} from '@/modules/nexotype/schemas/asset/biologic.schemas';
import { ListBiologicsParams } from '@/modules/nexotype/service/asset/biologic.service';

/**
 * Hook to use the biologic context
 * @throws Error if used outside of a BiologicProvider
 */
export function useBiologicContext(): BiologicContextType {
  const context = useContext(BiologicContext);

  if (!context) {
    throw new Error('useBiologicContext must be used within a BiologicProvider');
  }

  return context;
}

/**
 * Custom hook that combines biologic context and store
 * to provide a simplified interface for biologic functionality
 *
 * @returns Biologic utilities and state
 */
export function useBiologics() {
  // Get data from biologic context
  const {
    biologics,
    activeBiologicId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBiologic,
    clearError: clearContextError,
  } = useBiologicContext();

  // Get additional actions from biologic store
  const {
    fetchBiologics,
    fetchBiologic,
    createBiologic,
    updateBiologic,
    deleteBiologic,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBiologicStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active biologic
  const activeBiologic = biologics.find((item: Biologic) => item.id === activeBiologicId) || null;

  return {
    // State
    biologics,
    activeBiologicId,
    activeBiologic,
    isLoading,
    error,
    isInitialized,

    // Biologic actions
    fetchBiologics,
    fetchBiologic,
    createBiologic,
    updateBiologic,
    deleteBiologic,
    setActiveBiologic,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return biologics.find((item: Biologic) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListBiologicsParams) => {
      return await fetchBiologics(filters);
    },
    createWithData: async (data: CreateBiologic) => {
      return await createBiologic(data);
    },
    updateWithData: async (id: number, data: UpdateBiologic) => {
      return await updateBiologic(id, data);
    },
  };
}

export default useBiologics;
