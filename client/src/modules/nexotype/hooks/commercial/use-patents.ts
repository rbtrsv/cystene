'use client';

import { useContext } from 'react';
import { PatentContext, PatentContextType } from '@/modules/nexotype/providers/commercial/patent-provider';
import { usePatentStore } from '@/modules/nexotype/store/commercial/patent.store';
import {
  type Patent,
  type CreatePatent,
  type UpdatePatent,
  type PatentStatus,
  type Jurisdiction,
} from '@/modules/nexotype/schemas/commercial/patent.schemas';
import { ListPatentsParams } from '@/modules/nexotype/service/commercial/patent.service';

/**
 * Hook to use the patent context
 * @throws Error if used outside of a PatentProvider
 */
export function usePatentContext(): PatentContextType {
  const context = useContext(PatentContext);

  if (!context) {
    throw new Error('usePatentContext must be used within a PatentProvider');
  }

  return context;
}

/**
 * Custom hook that combines patent context and store
 * to provide a simplified interface for patent functionality
 *
 * @returns Patent utilities and state
 */
export function usePatents() {
  // Get data from patent context
  const {
    patents,
    activePatentId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePatent,
    clearError: clearContextError,
  } = usePatentContext();

  // Get additional actions from patent store
  const {
    fetchPatents,
    fetchPatent,
    createPatent,
    updatePatent,
    deletePatent,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePatentStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active patent
  const activePatent = patents.find(
    (patent: Patent) => patent.id === activePatentId
  ) || null;

  return {
    // State
    patents,
    activePatentId,
    activePatent,
    isLoading,
    error,
    isInitialized,

    // Patent actions
    fetchPatents,
    fetchPatent,
    createPatent,
    updatePatent,
    deletePatent,
    setActivePatent,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return patents.find((patent: Patent) => patent.id === id);
    },
    getByPatentNumber: (patentNumber: string) => {
      return patents.find((p: Patent) => p.patent_number === patentNumber);
    },
    getByStatus: (status: PatentStatus) => {
      return patents.filter((p: Patent) => p.status === status);
    },
    getByJurisdiction: (jurisdiction: Jurisdiction) => {
      return patents.filter((p: Patent) => p.jurisdiction === jurisdiction);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPatentsParams) => {
      return await fetchPatents(filters);
    },
    createWithData: async (data: CreatePatent) => {
      return await createPatent(data);
    },
    updateWithData: async (id: number, data: UpdatePatent) => {
      return await updatePatent(id, data);
    },
  };
}

export default usePatents;
