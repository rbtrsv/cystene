'use client';

import { useContext } from 'react';
import { PeptideFragmentContext, PeptideFragmentContextType } from '@/modules/nexotype/providers/omics/peptide-fragment-provider';
import { usePeptideFragmentStore } from '@/modules/nexotype/store/omics/peptide-fragment.store';
import {
  type PeptideFragment,
  type CreatePeptideFragment,
  type UpdatePeptideFragment,
} from '@/modules/nexotype/schemas/omics/peptide-fragment.schemas';
import { ListPeptideFragmentsParams } from '@/modules/nexotype/service/omics/peptide-fragment.service';

/**
 * Hook to use the peptide fragment context
 * @throws Error if used outside of a PeptideFragmentProvider
 */
export function usePeptideFragmentContext(): PeptideFragmentContextType {
  const context = useContext(PeptideFragmentContext);

  if (!context) {
    throw new Error('usePeptideFragmentContext must be used within a PeptideFragmentProvider');
  }

  return context;
}

/**
 * Custom hook that combines peptide fragment context and store
 * to provide a simplified interface for peptide fragment functionality
 *
 * @returns Peptide fragment utilities and state
 */
export function usePeptideFragments() {
  // Get data from peptide fragment context
  const {
    peptideFragments,
    activePeptideFragmentId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePeptideFragment,
    clearError: clearContextError,
  } = usePeptideFragmentContext();

  // Get additional actions from peptide fragment store
  const {
    fetchPeptideFragments,
    fetchPeptideFragment,
    createPeptideFragment,
    updatePeptideFragment,
    deletePeptideFragment,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePeptideFragmentStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active peptide fragment
  const activePeptideFragment = peptideFragments.find(
    (fragment: PeptideFragment) => fragment.id === activePeptideFragmentId
  ) || null;

  return {
    // State
    peptideFragments,
    activePeptideFragmentId,
    activePeptideFragment,
    isLoading,
    error,
    isInitialized,

    // Peptide fragment actions
    fetchPeptideFragments,
    fetchPeptideFragment,
    createPeptideFragment,
    updatePeptideFragment,
    deletePeptideFragment,
    setActivePeptideFragment,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return peptideFragments.find((fragment: PeptideFragment) => fragment.id === id);
    },
    getByProteinId: (proteinId: number) => {
      return peptideFragments.filter((fragment: PeptideFragment) => fragment.protein_id === proteinId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPeptideFragmentsParams) => {
      return await fetchPeptideFragments(filters);
    },
    createWithData: async (data: CreatePeptideFragment) => {
      return await createPeptideFragment(data);
    },
    updateWithData: async (id: number, data: UpdatePeptideFragment) => {
      return await updatePeptideFragment(id, data);
    },
  };
}

export default usePeptideFragments;
