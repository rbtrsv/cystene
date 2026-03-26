'use client';

import { useContext } from 'react';
import {
  TherapeuticPeptideContext,
  TherapeuticPeptideContextType,
} from '@/modules/nexotype/providers/asset/therapeutic-peptide-provider';
import { useTherapeuticPeptideStore } from '@/modules/nexotype/store/asset/therapeutic-peptide.store';
import {
  type TherapeuticPeptide,
  type CreateTherapeuticPeptide,
  type UpdateTherapeuticPeptide,
} from '@/modules/nexotype/schemas/asset/therapeutic-peptide.schemas';
import { ListTherapeuticPeptidesParams } from '@/modules/nexotype/service/asset/therapeutic-peptide.service';

/**
 * Hook to use the therapeutic peptide context
 * @throws Error if used outside of a TherapeuticPeptideProvider
 */
export function useTherapeuticPeptideContext(): TherapeuticPeptideContextType {
  const context = useContext(TherapeuticPeptideContext);

  if (!context) {
    throw new Error('useTherapeuticPeptideContext must be used within a TherapeuticPeptideProvider');
  }

  return context;
}

/**
 * Custom hook that combines therapeutic peptide context and store
 * to provide a simplified interface for therapeutic peptide functionality
 *
 * @returns TherapeuticPeptide utilities and state
 */
export function useTherapeuticPeptides() {
  // Get data from therapeutic peptide context
  const {
    therapeuticPeptides,
    activeTherapeuticPeptideId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTherapeuticPeptide,
    clearError: clearContextError,
  } = useTherapeuticPeptideContext();

  // Get additional actions from therapeutic peptide store
  const {
    fetchTherapeuticPeptides,
    fetchTherapeuticPeptide,
    createTherapeuticPeptide,
    updateTherapeuticPeptide,
    deleteTherapeuticPeptide,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTherapeuticPeptideStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active therapeutic peptide
  const activeTherapeuticPeptide = therapeuticPeptides.find((item: TherapeuticPeptide) => item.id === activeTherapeuticPeptideId) || null;

  return {
    // State
    therapeuticPeptides,
    activeTherapeuticPeptideId,
    activeTherapeuticPeptide,
    isLoading,
    error,
    isInitialized,

    // TherapeuticPeptide actions
    fetchTherapeuticPeptides,
    fetchTherapeuticPeptide,
    createTherapeuticPeptide,
    updateTherapeuticPeptide,
    deleteTherapeuticPeptide,
    setActiveTherapeuticPeptide,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return therapeuticPeptides.find((item: TherapeuticPeptide) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTherapeuticPeptidesParams) => {
      return await fetchTherapeuticPeptides(filters);
    },
    createWithData: async (data: CreateTherapeuticPeptide) => {
      return await createTherapeuticPeptide(data);
    },
    updateWithData: async (id: number, data: UpdateTherapeuticPeptide) => {
      return await updateTherapeuticPeptide(id, data);
    },
  };
}

export default useTherapeuticPeptides;
