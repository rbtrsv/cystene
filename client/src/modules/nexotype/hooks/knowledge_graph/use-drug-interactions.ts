'use client';

import { useContext } from 'react';
import { DrugInteractionContext, DrugInteractionContextType } from '@/modules/nexotype/providers/knowledge_graph/drug-interaction-provider';
import { useDrugInteractionStore } from '@/modules/nexotype/store/knowledge_graph/drug-interaction.store';
import {
  type DrugInteraction,
  type CreateDrugInteraction,
  type UpdateDrugInteraction,
} from '@/modules/nexotype/schemas/knowledge_graph/drug-interaction.schemas';
import { ListDrugInteractionsParams } from '@/modules/nexotype/service/knowledge_graph/drug-interaction.service';

/**
 * Hook to use the drug interaction context
 * @throws Error if used outside of a DrugInteractionProvider
 */
export function useDrugInteractionContext(): DrugInteractionContextType {
  const context = useContext(DrugInteractionContext);

  if (!context) {
    throw new Error('useDrugInteractionContext must be used within a DrugInteractionProvider');
  }

  return context;
}

/**
 * Custom hook that combines drug interaction context and store
 * to provide a simplified interface for drug interaction functionality
 *
 * @returns Drug interaction utilities and state
 */
export function useDrugInteractions() {
  // Get data from drug interaction context
  const {
    drugInteractions,
    activeDrugInteractionId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDrugInteraction,
    clearError: clearContextError,
  } = useDrugInteractionContext();

  // Get additional actions from drug interaction store
  const {
    fetchDrugInteractions,
    fetchDrugInteraction,
    createDrugInteraction,
    updateDrugInteraction,
    deleteDrugInteraction,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDrugInteractionStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active drug interaction
  const activeDrugInteraction = drugInteractions.find((item: DrugInteraction) => item.id === activeDrugInteractionId) || null;

  return {
    // State
    drugInteractions,
    activeDrugInteractionId,
    activeDrugInteraction,
    isLoading,
    error,
    isInitialized,

    // DrugInteraction actions
    fetchDrugInteractions,
    fetchDrugInteraction,
    createDrugInteraction,
    updateDrugInteraction,
    deleteDrugInteraction,
    setActiveDrugInteraction,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return drugInteractions.find((item: DrugInteraction) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListDrugInteractionsParams) => {
      return await fetchDrugInteractions(filters);
    },
    createWithData: async (data: CreateDrugInteraction) => {
      return await createDrugInteraction(data);
    },
    updateWithData: async (id: number, data: UpdateDrugInteraction) => {
      return await updateDrugInteraction(id, data);
    },
  };
}

export default useDrugInteractions;
