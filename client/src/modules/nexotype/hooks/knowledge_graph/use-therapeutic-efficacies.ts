'use client';

import { useContext } from 'react';
import { TherapeuticEfficacyContext, TherapeuticEfficacyContextType } from '@/modules/nexotype/providers/knowledge_graph/therapeutic-efficacy-provider';
import { useTherapeuticEfficacyStore } from '@/modules/nexotype/store/knowledge_graph/therapeutic-efficacy.store';
import {
  type TherapeuticEfficacy,
  type CreateTherapeuticEfficacy,
  type UpdateTherapeuticEfficacy,
} from '@/modules/nexotype/schemas/knowledge_graph/therapeutic-efficacy.schemas';
import { ListTherapeuticEfficaciesParams } from '@/modules/nexotype/service/knowledge_graph/therapeutic-efficacy.service';

/**
 * Hook to use the therapeutic efficacy context
 * @throws Error if used outside of a TherapeuticEfficacyProvider
 */
export function useTherapeuticEfficacyContext(): TherapeuticEfficacyContextType {
  const context = useContext(TherapeuticEfficacyContext);

  if (!context) {
    throw new Error('useTherapeuticEfficacyContext must be used within a TherapeuticEfficacyProvider');
  }

  return context;
}

/**
 * Custom hook that combines therapeutic efficacy context and store
 * to provide a simplified interface for therapeutic efficacy functionality
 *
 * @returns Therapeutic efficacy utilities and state
 */
export function useTherapeuticEfficacies() {
  // Get data from therapeutic efficacy context
  const {
    therapeuticEfficacies,
    activeTherapeuticEfficacyId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTherapeuticEfficacy,
    clearError: clearContextError,
  } = useTherapeuticEfficacyContext();

  // Get additional actions from therapeutic efficacy store
  const {
    fetchTherapeuticEfficacies,
    fetchTherapeuticEfficacy,
    createTherapeuticEfficacy,
    updateTherapeuticEfficacy,
    deleteTherapeuticEfficacy,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTherapeuticEfficacyStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active therapeutic efficacy
  const activeTherapeuticEfficacy = therapeuticEfficacies.find((item: TherapeuticEfficacy) => item.id === activeTherapeuticEfficacyId) || null;

  return {
    // State
    therapeuticEfficacies,
    activeTherapeuticEfficacyId,
    activeTherapeuticEfficacy,
    isLoading,
    error,
    isInitialized,

    // TherapeuticEfficacy actions
    fetchTherapeuticEfficacies,
    fetchTherapeuticEfficacy,
    createTherapeuticEfficacy,
    updateTherapeuticEfficacy,
    deleteTherapeuticEfficacy,
    setActiveTherapeuticEfficacy,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return therapeuticEfficacies.find((item: TherapeuticEfficacy) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTherapeuticEfficaciesParams) => {
      return await fetchTherapeuticEfficacies(filters);
    },
    createWithData: async (data: CreateTherapeuticEfficacy) => {
      return await createTherapeuticEfficacy(data);
    },
    updateWithData: async (id: number, data: UpdateTherapeuticEfficacy) => {
      return await updateTherapeuticEfficacy(id, data);
    },
  };
}

export default useTherapeuticEfficacies;
