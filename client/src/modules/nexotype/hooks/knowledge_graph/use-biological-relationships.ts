'use client';

import { useContext } from 'react';
import { BiologicalRelationshipContext, BiologicalRelationshipContextType } from '@/modules/nexotype/providers/knowledge_graph/biological-relationship-provider';
import { useBiologicalRelationshipStore } from '@/modules/nexotype/store/knowledge_graph/biological-relationship.store';
import {
  type BiologicalRelationship,
  type CreateBiologicalRelationship,
  type UpdateBiologicalRelationship,
} from '@/modules/nexotype/schemas/knowledge_graph/biological-relationship.schemas';
import { ListBiologicalRelationshipsParams } from '@/modules/nexotype/service/knowledge_graph/biological-relationship.service';

/**
 * Hook to use the biological relationship context
 * @throws Error if used outside of a BiologicalRelationshipProvider
 */
export function useBiologicalRelationshipContext(): BiologicalRelationshipContextType {
  const context = useContext(BiologicalRelationshipContext);
  if (!context) {
    throw new Error('useBiologicalRelationshipContext must be used within a BiologicalRelationshipProvider');
  }
  return context;
}

/**
 * Custom hook that combines biological relationship context and store
 * to provide a simplified interface for biological relationship functionality.
 *
 * @returns Biological relationship utilities and state
 */
export function useBiologicalRelationships() {
  // Get data from biological relationship context
  const {
    biologicalRelationships,
    activeBiologicalRelationshipId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveBiologicalRelationship,
    clearError: clearContextError,
  } = useBiologicalRelationshipContext();

  // Get additional actions from biological relationship store
  const {
    fetchBiologicalRelationships,
    fetchBiologicalRelationship,
    createBiologicalRelationship,
    updateBiologicalRelationship,
    deleteBiologicalRelationship,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useBiologicalRelationshipStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active biological relationship
  const activeBiologicalRelationship = biologicalRelationships.find(
    (biologicalRelationship: BiologicalRelationship) => biologicalRelationship.id === activeBiologicalRelationshipId
  ) || null;

  return {
    // State
    biologicalRelationships,
    activeBiologicalRelationshipId,
    activeBiologicalRelationship,
    isLoading,
    error,
    isInitialized,
    fetchBiologicalRelationships,
    fetchBiologicalRelationship,
    createBiologicalRelationship,
    updateBiologicalRelationship,
    deleteBiologicalRelationship,
    setActiveBiologicalRelationship,
    initialize,
    clearError,
    // Helper methods
    getById: (id: number) => {
      return biologicalRelationships.find((biologicalRelationship: BiologicalRelationship) => biologicalRelationship.id === id);
    },
    // entity-specific helpers — filter biological relationships by protein (either side of the relationship)
    getByProteinId: (proteinId: number) => {
      return biologicalRelationships.filter(
        (biologicalRelationship: BiologicalRelationship) =>
          biologicalRelationship.protein_a_id === proteinId || biologicalRelationship.protein_b_id === proteinId
      );
    },
    fetchWithFilters: async (filters: ListBiologicalRelationshipsParams) => {
      return await fetchBiologicalRelationships(filters);
    },
    createWithData: async (data: CreateBiologicalRelationship) => {
      return await createBiologicalRelationship(data);
    },
    updateWithData: async (id: number, data: UpdateBiologicalRelationship) => {
      return await updateBiologicalRelationship(id, data);
    },
  };
}

export default useBiologicalRelationships;
