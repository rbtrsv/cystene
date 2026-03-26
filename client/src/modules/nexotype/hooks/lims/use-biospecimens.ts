'use client';

import { useContext } from 'react';
import {
  BiospecimenContext,
  BiospecimenContextType,
} from '@/modules/nexotype/providers/lims/biospecimen-provider';
import { useBiospecimenStore } from '@/modules/nexotype/store/lims/biospecimen.store';
import {
  type Biospecimen,
  type CreateBiospecimen,
  type UpdateBiospecimen,
} from '@/modules/nexotype/schemas/lims/biospecimen.schemas';
import { ListBiospecimensParams } from '@/modules/nexotype/service/lims/biospecimen.service';

/**
 * Hook to use the biospecimen context
 * @throws Error if used outside of a BiospecimenProvider
 */
export function useBiospecimenContext(): BiospecimenContextType {
  const context = useContext(BiospecimenContext);

  if (!context) {
    throw new Error('useBiospecimenContext must be used within a BiospecimenProvider');
  }

  return context;
}

/**
 * Custom hook that combines biospecimen context and store
 * to provide a simplified interface for biospecimen functionality
 *
 * @returns Biospecimen utilities and state
 */
export function useBiospecimens() {
  // Get data from biospecimen context
  const {
    biospecimens,
    activeBiospecimenId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBiospecimen,
    clearError: clearContextError,
  } = useBiospecimenContext();

  // Get additional actions from biospecimen store
  const {
    fetchBiospecimens,
    fetchBiospecimen,
    createBiospecimen,
    updateBiospecimen,
    deleteBiospecimen,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBiospecimenStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active biospecimen
  const activeBiospecimen = biospecimens.find((item: Biospecimen) => item.id === activeBiospecimenId) || null;

  return {
    // State
    biospecimens,
    activeBiospecimenId,
    activeBiospecimen,
    isLoading,
    error,
    isInitialized,

    // Biospecimen actions
    fetchBiospecimens,
    fetchBiospecimen,
    createBiospecimen,
    updateBiospecimen,
    deleteBiospecimen,
    setActiveBiospecimen,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return biospecimens.find((item: Biospecimen) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListBiospecimensParams) => {
      return await fetchBiospecimens(filters);
    },
    createWithData: async (data: CreateBiospecimen) => {
      return await createBiospecimen(data);
    },
    updateWithData: async (id: number, data: UpdateBiospecimen) => {
      return await updateBiospecimen(id, data);
    },
  };
}

export default useBiospecimens;
