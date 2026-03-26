'use client';

import { useContext } from 'react';
import { ProteinContext, ProteinContextType } from '@/modules/nexotype/providers/omics/protein-provider';
import { useProteinStore } from '@/modules/nexotype/store/omics/protein.store';
import {
  type Protein,
  type CreateProtein,
  type UpdateProtein,
} from '@/modules/nexotype/schemas/omics/protein.schemas';
import { ListProteinsParams } from '@/modules/nexotype/service/omics/protein.service';

/**
 * Hook to use the protein context
 * @throws Error if used outside of a ProteinProvider
 */
export function useProteinContext(): ProteinContextType {
  const context = useContext(ProteinContext);

  if (!context) {
    throw new Error('useProteinContext must be used within a ProteinProvider');
  }

  return context;
}

/**
 * Custom hook that combines protein context and store
 * to provide a simplified interface for protein functionality
 *
 * @returns Protein utilities and state
 */
export function useProteins() {
  // Get data from protein context
  const {
    proteins,
    activeProteinId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveProtein,
    clearError: clearContextError,
  } = useProteinContext();

  // Get additional actions from protein store
  const {
    fetchProteins,
    fetchProtein,
    createProtein,
    updateProtein,
    deleteProtein,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useProteinStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active protein
  const activeProtein = proteins.find(
    (p: Protein) => p.id === activeProteinId
  ) || null;

  return {
    // State
    proteins,
    activeProteinId,
    activeProtein,
    isLoading,
    error,
    isInitialized,

    // Protein actions
    fetchProteins,
    fetchProtein,
    createProtein,
    updateProtein,
    deleteProtein,
    setActiveProtein,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return proteins.find((p: Protein) => p.id === id);
    },
    getByName: (id: number) => {
      const p = proteins.find((pr: Protein) => pr.id === id);
      return p ? p.uniprot_accession : 'Unknown Protein';
    },
    getByUniprotAccession: (uniprotAccession: string) => {
      return proteins.find((p: Protein) => p.uniprot_accession === uniprotAccession);
    },
    getByTranscriptId: (transcriptId: number) => {
      return proteins.find((p: Protein) => p.transcript_id === transcriptId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListProteinsParams) => {
      return await fetchProteins(filters);
    },
    createWithData: async (data: CreateProtein) => {
      return await createProtein(data);
    },
    updateWithData: async (id: number, data: UpdateProtein) => {
      return await updateProtein(id, data);
    },
  };
}

export default useProteins;
