'use client';

import { useContext } from 'react';
import { BiomarkerAssociationContext, BiomarkerAssociationContextType } from '@/modules/nexotype/providers/knowledge_graph/biomarker-association-provider';
import { useBiomarkerAssociationStore } from '@/modules/nexotype/store/knowledge_graph/biomarker-association.store';
import {
  type BiomarkerAssociation,
  type CreateBiomarkerAssociation,
  type UpdateBiomarkerAssociation,
} from '@/modules/nexotype/schemas/knowledge_graph/biomarker-association.schemas';
import { ListBiomarkerAssociationsParams } from '@/modules/nexotype/service/knowledge_graph/biomarker-association.service';

/**
 * Hook to use the biomarker association context
 * @throws Error if used outside of a BiomarkerAssociationProvider
 */
export function useBiomarkerAssociationContext(): BiomarkerAssociationContextType {
  const context = useContext(BiomarkerAssociationContext);

  if (!context) {
    throw new Error('useBiomarkerAssociationContext must be used within a BiomarkerAssociationProvider');
  }

  return context;
}

/**
 * Custom hook that combines biomarker association context and store
 * to provide a simplified interface for biomarker association functionality
 *
 * @returns Biomarker association utilities and state
 */
export function useBiomarkerAssociations() {
  // Get data from biomarker association context
  const {
    biomarkerAssociations,
    activeBiomarkerAssociationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBiomarkerAssociation,
    clearError: clearContextError,
  } = useBiomarkerAssociationContext();

  // Get additional actions from biomarker association store
  const {
    fetchBiomarkerAssociations,
    fetchBiomarkerAssociation,
    createBiomarkerAssociation,
    updateBiomarkerAssociation,
    deleteBiomarkerAssociation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBiomarkerAssociationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active biomarker association
  const activeBiomarkerAssociation = biomarkerAssociations.find((item: BiomarkerAssociation) => item.id === activeBiomarkerAssociationId) || null;

  return {
    // State
    biomarkerAssociations,
    activeBiomarkerAssociationId,
    activeBiomarkerAssociation,
    isLoading,
    error,
    isInitialized,

    // BiomarkerAssociation actions
    fetchBiomarkerAssociations,
    fetchBiomarkerAssociation,
    createBiomarkerAssociation,
    updateBiomarkerAssociation,
    deleteBiomarkerAssociation,
    setActiveBiomarkerAssociation,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return biomarkerAssociations.find((item: BiomarkerAssociation) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListBiomarkerAssociationsParams) => {
      return await fetchBiomarkerAssociations(filters);
    },
    createWithData: async (data: CreateBiomarkerAssociation) => {
      return await createBiomarkerAssociation(data);
    },
    updateWithData: async (id: number, data: UpdateBiomarkerAssociation) => {
      return await updateBiomarkerAssociation(id, data);
    },
  };
}

export default useBiomarkerAssociations;
