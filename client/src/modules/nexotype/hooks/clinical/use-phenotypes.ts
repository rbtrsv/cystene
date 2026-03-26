'use client';

import { useContext } from 'react';
import { PhenotypeContext, PhenotypeContextType } from '@/modules/nexotype/providers/clinical/phenotype-provider';
import { usePhenotypeStore } from '@/modules/nexotype/store/clinical/phenotype.store';
import {
  type Phenotype,
  type CreatePhenotype,
  type UpdatePhenotype,
} from '@/modules/nexotype/schemas/clinical/phenotype.schemas';
import { ListPhenotypesParams } from '@/modules/nexotype/service/clinical/phenotype.service';

/**
 * Hook to use the phenotype context
 * @throws Error if used outside of a PhenotypeProvider
 */
export function usePhenotypeContext(): PhenotypeContextType {
  const context = useContext(PhenotypeContext);

  if (!context) {
    throw new Error('usePhenotypeContext must be used within a PhenotypeProvider');
  }

  return context;
}

/**
 * Custom hook that combines phenotype context and store
 * to provide a simplified interface for phenotype functionality
 *
 * @returns Phenotype utilities and state
 */
export function usePhenotypes() {
  // Get data from phenotype context
  const {
    phenotypes,
    activePhenotypeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePhenotype,
    clearError: clearContextError,
  } = usePhenotypeContext();

  // Get additional actions from phenotype store
  const {
    fetchPhenotypes,
    fetchPhenotype,
    createPhenotype,
    updatePhenotype,
    deletePhenotype,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePhenotypeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active phenotype
  const activePhenotype = phenotypes.find(
    (ph: Phenotype) => ph.id === activePhenotypeId
  ) || null;

  return {
    // State
    phenotypes,
    activePhenotypeId,
    activePhenotype,
    isLoading,
    error,
    isInitialized,

    // Phenotype actions
    fetchPhenotypes,
    fetchPhenotype,
    createPhenotype,
    updatePhenotype,
    deletePhenotype,
    setActivePhenotype,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return phenotypes.find((ph: Phenotype) => ph.id === id);
    },
    getByName: (id: number) => {
      const ph = phenotypes.find((p: Phenotype) => p.id === id);
      return ph ? ph.name : 'Unknown Phenotype';
    },
    getByHpoId: (hpoId: string) => {
      return phenotypes.filter((p: Phenotype) => p.hpo_id === hpoId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPhenotypesParams) => {
      return await fetchPhenotypes(filters);
    },
    createWithData: async (data: CreatePhenotype) => {
      return await createPhenotype(data);
    },
    updateWithData: async (id: number, data: UpdatePhenotype) => {
      return await updatePhenotype(id, data);
    },
  };
}

export default usePhenotypes;
