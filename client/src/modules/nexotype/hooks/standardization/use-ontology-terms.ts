'use client';

import { useContext } from 'react';
import { OntologyTermContext, OntologyTermContextType } from '@/modules/nexotype/providers/standardization/ontology-term-provider';
import { useOntologyTermStore } from '@/modules/nexotype/store/standardization/ontology-term.store';
import {
  type OntologyTerm,
  type CreateOntologyTerm,
  type UpdateOntologyTerm,
} from '@/modules/nexotype/schemas/standardization/ontology-term.schemas';
import { ListOntologyTermsParams } from '@/modules/nexotype/service/standardization/ontology-term.service';

/**
 * Hook to use the ontology term context
 * @throws Error if used outside of an OntologyTermProvider
 */
export function useOntologyTermContext(): OntologyTermContextType {
  const context = useContext(OntologyTermContext);

  if (!context) {
    throw new Error('useOntologyTermContext must be used within an OntologyTermProvider');
  }

  return context;
}

/**
 * Custom hook that combines ontology term context and store
 * to provide a simplified interface for ontology term functionality
 *
 * @returns Ontology term utilities and state
 */
export function useOntologyTerms() {
  // Get data from ontology term context
  const {
    ontologyTerms,
    activeOntologyTermId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOntologyTerm,
    clearError: clearContextError,
  } = useOntologyTermContext();

  // Get additional actions from ontology term store
  const {
    fetchOntologyTerms,
    fetchOntologyTerm,
    createOntologyTerm,
    updateOntologyTerm,
    deleteOntologyTerm,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useOntologyTermStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active ontology term
  const activeOntologyTerm = ontologyTerms.find(
    (ot: OntologyTerm) => ot.id === activeOntologyTermId
  ) || null;

  return {
    // State
    ontologyTerms,
    activeOntologyTermId,
    activeOntologyTerm,
    isLoading,
    error,
    isInitialized,

    // Ontology term actions
    fetchOntologyTerms,
    fetchOntologyTerm,
    createOntologyTerm,
    updateOntologyTerm,
    deleteOntologyTerm,
    setActiveOntologyTerm,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return ontologyTerms.find((ot: OntologyTerm) => ot.id === id);
    },
    getByAccession: (accession: string) => {
      return ontologyTerms.find((ot: OntologyTerm) => ot.accession === accession);
    },
    getBySource: (source: string) => {
      return ontologyTerms.filter((ot: OntologyTerm) => ot.source === source);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListOntologyTermsParams) => {
      return await fetchOntologyTerms(filters);
    },
    createWithData: async (data: CreateOntologyTerm) => {
      return await createOntologyTerm(data);
    },
    updateWithData: async (id: number, data: UpdateOntologyTerm) => {
      return await updateOntologyTerm(id, data);
    },
  };
}

export default useOntologyTerms;
