'use client';

import { useContext } from 'react';
import { DrugTargetMechanismContext, DrugTargetMechanismContextType } from '@/modules/nexotype/providers/knowledge_graph/drug-target-mechanism-provider';
import { useDrugTargetMechanismStore } from '@/modules/nexotype/store/knowledge_graph/drug-target-mechanism.store';
import {
  type DrugTargetMechanism,
  type CreateDrugTargetMechanism,
  type UpdateDrugTargetMechanism,
} from '@/modules/nexotype/schemas/knowledge_graph/drug-target-mechanism.schemas';
import { ListDrugTargetMechanismsParams } from '@/modules/nexotype/service/knowledge_graph/drug-target-mechanism.service';

/**
 * Hook to use the drug target mechanism context
 * @throws Error if used outside of a DrugTargetMechanismProvider
 */
export function useDrugTargetMechanismContext(): DrugTargetMechanismContextType {
  const context = useContext(DrugTargetMechanismContext);

  if (!context) {
    throw new Error('useDrugTargetMechanismContext must be used within a DrugTargetMechanismProvider');
  }

  return context;
}

/**
 * Custom hook that combines drug target mechanism context and store
 * to provide a simplified interface for drug target mechanism functionality
 *
 * @returns Drug target mechanism utilities and state
 */
export function useDrugTargetMechanisms() {
  // Get data from drug target mechanism context
  const {
    drugTargetMechanisms,
    activeDrugTargetMechanismId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDrugTargetMechanism,
    clearError: clearContextError,
  } = useDrugTargetMechanismContext();

  // Get additional actions from drug target mechanism store
  const {
    fetchDrugTargetMechanisms,
    fetchDrugTargetMechanism,
    createDrugTargetMechanism,
    updateDrugTargetMechanism,
    deleteDrugTargetMechanism,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDrugTargetMechanismStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active drug target mechanism
  const activeDrugTargetMechanism = drugTargetMechanisms.find((item: DrugTargetMechanism) => item.id === activeDrugTargetMechanismId) || null;

  return {
    // State
    drugTargetMechanisms,
    activeDrugTargetMechanismId,
    activeDrugTargetMechanism,
    isLoading,
    error,
    isInitialized,

    // DrugTargetMechanism actions
    fetchDrugTargetMechanisms,
    fetchDrugTargetMechanism,
    createDrugTargetMechanism,
    updateDrugTargetMechanism,
    deleteDrugTargetMechanism,
    setActiveDrugTargetMechanism,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return drugTargetMechanisms.find((item: DrugTargetMechanism) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListDrugTargetMechanismsParams) => {
      return await fetchDrugTargetMechanisms(filters);
    },
    createWithData: async (data: CreateDrugTargetMechanism) => {
      return await createDrugTargetMechanism(data);
    },
    updateWithData: async (id: number, data: UpdateDrugTargetMechanism) => {
      return await updateDrugTargetMechanism(id, data);
    },
  };
}

export default useDrugTargetMechanisms;
