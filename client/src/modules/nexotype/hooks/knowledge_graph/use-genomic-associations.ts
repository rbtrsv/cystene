'use client';

import { useContext } from 'react';
import { GenomicAssociationContext, GenomicAssociationContextType } from '@/modules/nexotype/providers/knowledge_graph/genomic-association-provider';
import { useGenomicAssociationStore } from '@/modules/nexotype/store/knowledge_graph/genomic-association.store';
import {
  type GenomicAssociation,
  type CreateGenomicAssociation,
  type UpdateGenomicAssociation,
} from '@/modules/nexotype/schemas/knowledge_graph/genomic-association.schemas';
import { ListGenomicAssociationsParams } from '@/modules/nexotype/service/knowledge_graph/genomic-association.service';

/**
 * Hook to use the genomic association context
 * @throws Error if used outside of a GenomicAssociationProvider
 */
export function useGenomicAssociationContext(): GenomicAssociationContextType {
  const context = useContext(GenomicAssociationContext);

  if (!context) {
    throw new Error('useGenomicAssociationContext must be used within a GenomicAssociationProvider');
  }

  return context;
}

/**
 * Custom hook that combines genomic association context and store
 * to provide a simplified interface for genomic association functionality
 *
 * @returns Genomic association utilities and state
 */
export function useGenomicAssociations() {
  // Get data from genomic association context
  const {
    genomicAssociations,
    activeGenomicAssociationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveGenomicAssociation,
    clearError: clearContextError,
  } = useGenomicAssociationContext();

  // Get additional actions from genomic association store
  const {
    fetchGenomicAssociations,
    fetchGenomicAssociation,
    createGenomicAssociation,
    updateGenomicAssociation,
    deleteGenomicAssociation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useGenomicAssociationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active genomic association
  const activeGenomicAssociation = genomicAssociations.find((item: GenomicAssociation) => item.id === activeGenomicAssociationId) || null;

  return {
    // State
    genomicAssociations,
    activeGenomicAssociationId,
    activeGenomicAssociation,
    isLoading,
    error,
    isInitialized,

    // GenomicAssociation actions
    fetchGenomicAssociations,
    fetchGenomicAssociation,
    createGenomicAssociation,
    updateGenomicAssociation,
    deleteGenomicAssociation,
    setActiveGenomicAssociation,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return genomicAssociations.find((item: GenomicAssociation) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListGenomicAssociationsParams) => {
      return await fetchGenomicAssociations(filters);
    },
    createWithData: async (data: CreateGenomicAssociation) => {
      return await createGenomicAssociation(data);
    },
    updateWithData: async (id: number, data: UpdateGenomicAssociation) => {
      return await updateGenomicAssociation(id, data);
    },
  };
}

export default useGenomicAssociations;
