'use client';

import { useContext } from 'react';
import { ExternalReferenceContext, ExternalReferenceContextType } from '@/modules/nexotype/providers/standardization/external-reference-provider';
import { useExternalReferenceStore } from '@/modules/nexotype/store/standardization/external-reference.store';
import {
  type ExternalReference,
  type CreateExternalReference,
  type UpdateExternalReference,
} from '@/modules/nexotype/schemas/standardization/external-reference.schemas';
import { ListExternalReferencesParams } from '@/modules/nexotype/service/standardization/external-reference.service';

/**
 * Hook to use the external reference context
 * @throws Error if used outside of an ExternalReferenceProvider
 */
export function useExternalReferenceContext(): ExternalReferenceContextType {
  const context = useContext(ExternalReferenceContext);

  if (!context) {
    throw new Error('useExternalReferenceContext must be used within an ExternalReferenceProvider');
  }

  return context;
}

/**
 * Custom hook that combines external reference context and store
 * to provide a simplified interface for external reference functionality
 *
 * @returns External reference utilities and state
 */
export function useExternalReferences() {
  // Get data from external reference context
  const {
    externalReferences,
    activeExternalReferenceId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveExternalReference,
    clearError: clearContextError,
  } = useExternalReferenceContext();

  // Get additional actions from external reference store
  const {
    fetchExternalReferences,
    fetchExternalReference,
    createExternalReference,
    updateExternalReference,
    deleteExternalReference,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useExternalReferenceStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active external reference
  const activeExternalReference = externalReferences.find(
    (er: ExternalReference) => er.id === activeExternalReferenceId
  ) || null;

  return {
    // State
    externalReferences,
    activeExternalReferenceId,
    activeExternalReference,
    isLoading,
    error,
    isInitialized,

    // External reference actions
    fetchExternalReferences,
    fetchExternalReference,
    createExternalReference,
    updateExternalReference,
    deleteExternalReference,
    setActiveExternalReference,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return externalReferences.find((er: ExternalReference) => er.id === id);
    },
    getByEntityType: (entityType: string) => {
      return externalReferences.filter((er: ExternalReference) => er.entity_type === entityType);
    },
    getBySource: (source: string) => {
      return externalReferences.filter((er: ExternalReference) => er.source === source);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListExternalReferencesParams) => {
      return await fetchExternalReferences(filters);
    },
    createWithData: async (data: CreateExternalReference) => {
      return await createExternalReference(data);
    },
    updateWithData: async (id: number, data: UpdateExternalReference) => {
      return await updateExternalReference(id, data);
    },
  };
}

export default useExternalReferences;
