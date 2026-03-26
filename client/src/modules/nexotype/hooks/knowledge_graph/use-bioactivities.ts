'use client';

import { useContext } from 'react';
import { BioactivityContext, BioactivityContextType } from '@/modules/nexotype/providers/knowledge_graph/bioactivity-provider';
import { useBioactivityStore } from '@/modules/nexotype/store/knowledge_graph/bioactivity.store';
import {
  type Bioactivity,
  type CreateBioactivity,
  type UpdateBioactivity,
} from '@/modules/nexotype/schemas/knowledge_graph/bioactivity.schemas';
import { ListBioactivitiesParams } from '@/modules/nexotype/service/knowledge_graph/bioactivity.service';

/**
 * Hook to use the bioactivity context
 * @throws Error if used outside of a BioactivityProvider
 */
export function useBioactivityContext(): BioactivityContextType {
  const context = useContext(BioactivityContext);

  if (!context) {
    throw new Error('useBioactivityContext must be used within a BioactivityProvider');
  }

  return context;
}

/**
 * Custom hook that combines bioactivity context and store
 * to provide a simplified interface for bioactivity functionality
 *
 * @returns Bioactivity utilities and state
 */
export function useBioactivities() {
  // Get data from bioactivity context
  const {
    bioactivities,
    activeBioactivityId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBioactivity,
    clearError: clearContextError,
  } = useBioactivityContext();

  // Get additional actions from bioactivity store
  const {
    fetchBioactivities,
    fetchBioactivity,
    createBioactivity,
    updateBioactivity,
    deleteBioactivity,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBioactivityStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active bioactivity
  const activeBioactivity = bioactivities.find((item: Bioactivity) => item.id === activeBioactivityId) || null;

  return {
    // State
    bioactivities,
    activeBioactivityId,
    activeBioactivity,
    isLoading,
    error,
    isInitialized,

    // Bioactivity actions
    fetchBioactivities,
    fetchBioactivity,
    createBioactivity,
    updateBioactivity,
    deleteBioactivity,
    setActiveBioactivity,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return bioactivities.find((item: Bioactivity) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListBioactivitiesParams) => {
      return await fetchBioactivities(filters);
    },
    createWithData: async (data: CreateBioactivity) => {
      return await createBioactivity(data);
    },
    updateWithData: async (id: number, data: UpdateBioactivity) => {
      return await updateBioactivity(id, data);
    },
  };
}

export default useBioactivities;
