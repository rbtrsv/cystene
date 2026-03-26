'use client';

import { useContext } from 'react';
import { IndicationContext, IndicationContextType } from '@/modules/nexotype/providers/clinical/indication-provider';
import { useIndicationStore } from '@/modules/nexotype/store/clinical/indication.store';
import {
  type Indication,
  type CreateIndication,
  type UpdateIndication,
} from '@/modules/nexotype/schemas/clinical/indication.schemas';
import { ListIndicationsParams } from '@/modules/nexotype/service/clinical/indication.service';

/**
 * Hook to use the indication context
 * @throws Error if used outside of an IndicationProvider
 */
export function useIndicationContext(): IndicationContextType {
  const context = useContext(IndicationContext);

  if (!context) {
    throw new Error('useIndicationContext must be used within an IndicationProvider');
  }

  return context;
}

/**
 * Custom hook that combines indication context and store
 * to provide a simplified interface for indication functionality
 *
 * @returns Indication utilities and state
 */
export function useIndications() {
  // Get data from indication context
  const {
    indications,
    activeIndicationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveIndication,
    clearError: clearContextError,
  } = useIndicationContext();

  // Get additional actions from indication store
  const {
    fetchIndications,
    fetchIndication,
    createIndication,
    updateIndication,
    deleteIndication,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useIndicationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active indication
  const activeIndication = indications.find(
    (ind: Indication) => ind.id === activeIndicationId
  ) || null;

  return {
    // State
    indications,
    activeIndicationId,
    activeIndication,
    isLoading,
    error,
    isInitialized,

    // Indication actions
    fetchIndications,
    fetchIndication,
    createIndication,
    updateIndication,
    deleteIndication,
    setActiveIndication,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return indications.find((ind: Indication) => ind.id === id);
    },
    getByName: (id: number) => {
      const ind = indications.find((i: Indication) => i.id === id);
      return ind ? ind.name : 'Unknown Indication';
    },
    getByIcd10Code: (code: string) => {
      return indications.filter((i: Indication) => i.icd_10_code === code);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListIndicationsParams) => {
      return await fetchIndications(filters);
    },
    createWithData: async (data: CreateIndication) => {
      return await createIndication(data);
    },
    updateWithData: async (id: number, data: UpdateIndication) => {
      return await updateIndication(id, data);
    },
  };
}

export default useIndications;
