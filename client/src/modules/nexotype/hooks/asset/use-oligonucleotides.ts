'use client';

import { useContext } from 'react';
import {
  OligonucleotideContext,
  OligonucleotideContextType,
} from '@/modules/nexotype/providers/asset/oligonucleotide-provider';
import { useOligonucleotideStore } from '@/modules/nexotype/store/asset/oligonucleotide.store';
import {
  type Oligonucleotide,
  type CreateOligonucleotide,
  type UpdateOligonucleotide,
} from '@/modules/nexotype/schemas/asset/oligonucleotide.schemas';
import { ListOligonucleotidesParams } from '@/modules/nexotype/service/asset/oligonucleotide.service';

/**
 * Hook to use the oligonucleotide context
 * @throws Error if used outside of a OligonucleotideProvider
 */
export function useOligonucleotideContext(): OligonucleotideContextType {
  const context = useContext(OligonucleotideContext);

  if (!context) {
    throw new Error('useOligonucleotideContext must be used within a OligonucleotideProvider');
  }

  return context;
}

/**
 * Custom hook that combines oligonucleotide context and store
 * to provide a simplified interface for oligonucleotide functionality
 *
 * @returns Oligonucleotide utilities and state
 */
export function useOligonucleotides() {
  // Get data from oligonucleotide context
  const {
    oligonucleotides,
    activeOligonucleotideId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOligonucleotide,
    clearError: clearContextError,
  } = useOligonucleotideContext();

  // Get additional actions from oligonucleotide store
  const {
    fetchOligonucleotides,
    fetchOligonucleotide,
    createOligonucleotide,
    updateOligonucleotide,
    deleteOligonucleotide,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useOligonucleotideStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active oligonucleotide
  const activeOligonucleotide = oligonucleotides.find(
    (item: Oligonucleotide) => item.id === activeOligonucleotideId
  ) || null;

  return {
    // State
    oligonucleotides,
    activeOligonucleotideId,
    activeOligonucleotide,
    isLoading,
    error,
    isInitialized,

    // Oligonucleotide actions
    fetchOligonucleotides,
    fetchOligonucleotide,
    createOligonucleotide,
    updateOligonucleotide,
    deleteOligonucleotide,
    setActiveOligonucleotide,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return oligonucleotides.find((item: Oligonucleotide) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListOligonucleotidesParams) => {
      return await fetchOligonucleotides(filters);
    },
    createWithData: async (data: CreateOligonucleotide) => {
      return await createOligonucleotide(data);
    },
    updateWithData: async (id: number, data: UpdateOligonucleotide) => {
      return await updateOligonucleotide(id, data);
    },
  };
}

export default useOligonucleotides;
