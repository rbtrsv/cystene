'use client';

import { useContext } from 'react';
import { BiomarkerContext, BiomarkerContextType } from '@/modules/nexotype/providers/clinical/biomarker-provider';
import { useBiomarkerStore } from '@/modules/nexotype/store/clinical/biomarker.store';
import {
  type Biomarker,
  type CreateBiomarker,
  type UpdateBiomarker,
} from '@/modules/nexotype/schemas/clinical/biomarker.schemas';
import { ListBiomarkersParams } from '@/modules/nexotype/service/clinical/biomarker.service';

/**
 * Hook to use the biomarker context
 * @throws Error if used outside of a BiomarkerProvider
 */
export function useBiomarkerContext(): BiomarkerContextType {
  const context = useContext(BiomarkerContext);

  if (!context) {
    throw new Error('useBiomarkerContext must be used within a BiomarkerProvider');
  }

  return context;
}

/**
 * Custom hook that combines biomarker context and store
 * to provide a simplified interface for biomarker functionality
 *
 * @returns Biomarker utilities and state
 */
export function useBiomarkers() {
  // Get data from biomarker context
  const {
    biomarkers,
    activeBiomarkerId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBiomarker,
    clearError: clearContextError,
  } = useBiomarkerContext();

  // Get additional actions from biomarker store
  const {
    fetchBiomarkers,
    fetchBiomarker,
    createBiomarker,
    updateBiomarker,
    deleteBiomarker,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBiomarkerStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active biomarker
  const activeBiomarker = biomarkers.find(
    (bm: Biomarker) => bm.id === activeBiomarkerId
  ) || null;

  return {
    // State
    biomarkers,
    activeBiomarkerId,
    activeBiomarker,
    isLoading,
    error,
    isInitialized,

    // Biomarker actions
    fetchBiomarkers,
    fetchBiomarker,
    createBiomarker,
    updateBiomarker,
    deleteBiomarker,
    setActiveBiomarker,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return biomarkers.find((bm: Biomarker) => bm.id === id);
    },
    getByName: (id: number) => {
      const bm = biomarkers.find((b: Biomarker) => b.id === id);
      return bm ? bm.name : 'Unknown Biomarker';
    },
    getByLoincCode: (loincCode: string) => {
      return biomarkers.filter((b: Biomarker) => b.loinc_code === loincCode);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListBiomarkersParams) => {
      return await fetchBiomarkers(filters);
    },
    createWithData: async (data: CreateBiomarker) => {
      return await createBiomarker(data);
    },
    updateWithData: async (id: number, data: UpdateBiomarker) => {
      return await updateBiomarker(id, data);
    },
  };
}

export default useBiomarkers;
