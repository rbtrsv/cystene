'use client';

import { useContext } from 'react';
import { ExonContext, ExonContextType } from '@/modules/nexotype/providers/omics/exon-provider';
import { useExonStore } from '@/modules/nexotype/store/omics/exon.store';
import {
  type Exon,
  type CreateExon,
  type UpdateExon,
} from '@/modules/nexotype/schemas/omics/exon.schemas';
import { ListExonsParams } from '@/modules/nexotype/service/omics/exon.service';

/**
 * Hook to use the exon context
 * @throws Error if used outside of an ExonProvider
 */
export function useExonContext(): ExonContextType {
  const context = useContext(ExonContext);

  if (!context) {
    throw new Error('useExonContext must be used within an ExonProvider');
  }

  return context;
}

/**
 * Custom hook that combines exon context and store
 * to provide a simplified interface for exon functionality
 *
 * @returns Exon utilities and state
 */
export function useExons() {
  // Get data from exon context
  const {
    exons,
    activeExonId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveExon,
    clearError: clearContextError,
  } = useExonContext();

  // Get additional actions from exon store
  const {
    fetchExons,
    fetchExon,
    createExon,
    updateExon,
    deleteExon,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useExonStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active exon
  const activeExon = exons.find(
    (e: Exon) => e.id === activeExonId
  ) || null;

  return {
    // State
    exons,
    activeExonId,
    activeExon,
    isLoading,
    error,
    isInitialized,

    // Exon actions
    fetchExons,
    fetchExon,
    createExon,
    updateExon,
    deleteExon,
    setActiveExon,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return exons.find((e: Exon) => e.id === id);
    },
    getByName: (id: number) => {
      const e = exons.find((ex: Exon) => ex.id === id);
      return e ? e.ensembl_exon_id : 'Unknown Exon';
    },
    getByEnsemblExonId: (ensemblExonId: string) => {
      return exons.find((e: Exon) => e.ensembl_exon_id === ensemblExonId);
    },
    getByTranscriptId: (transcriptId: number) => {
      return exons.filter((e: Exon) => e.transcript_id === transcriptId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListExonsParams) => {
      return await fetchExons(filters);
    },
    createWithData: async (data: CreateExon) => {
      return await createExon(data);
    },
    updateWithData: async (id: number, data: UpdateExon) => {
      return await updateExon(id, data);
    },
  };
}

export default useExons;
