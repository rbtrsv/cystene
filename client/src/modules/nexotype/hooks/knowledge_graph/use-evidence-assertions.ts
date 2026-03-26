'use client';

import { useContext } from 'react';
import { EvidenceAssertionContext, EvidenceAssertionContextType } from '@/modules/nexotype/providers/knowledge_graph/evidence-assertion-provider';
import { useEvidenceAssertionStore } from '@/modules/nexotype/store/knowledge_graph/evidence-assertion.store';
import {
  type EvidenceAssertion,
  type CreateEvidenceAssertion,
  type UpdateEvidenceAssertion,
} from '@/modules/nexotype/schemas/knowledge_graph/evidence-assertion.schemas';
import { ListEvidenceAssertionsParams } from '@/modules/nexotype/service/knowledge_graph/evidence-assertion.service';

/**
 * Hook to use the evidence assertion context
 * @throws Error if used outside of an EvidenceAssertionProvider
 */
export function useEvidenceAssertionContext(): EvidenceAssertionContextType {
  const context = useContext(EvidenceAssertionContext);
  if (!context) {
    throw new Error('useEvidenceAssertionContext must be used within a EvidenceAssertionProvider');
  }
  return context;
}

/**
 * Custom hook that combines evidence assertion context and store
 * to provide a simplified interface for evidence assertion functionality.
 *
 * @returns Evidence assertion utilities and state
 */
export function useEvidenceAssertions() {
  // Get data from evidence assertion context
  const {
    evidenceAssertions,
    activeEvidenceAssertionId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveEvidenceAssertion,
    clearError: clearContextError,
  } = useEvidenceAssertionContext();

  // Get additional actions from evidence assertion store
  const {
    fetchEvidenceAssertions,
    fetchEvidenceAssertion,
    createEvidenceAssertion,
    updateEvidenceAssertion,
    deleteEvidenceAssertion,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useEvidenceAssertionStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active evidence assertion
  const activeEvidenceAssertion = evidenceAssertions.find(
    (evidenceAssertion: EvidenceAssertion) => evidenceAssertion.id === activeEvidenceAssertionId
  ) || null;

  return {
    // State
    evidenceAssertions,
    activeEvidenceAssertionId,
    activeEvidenceAssertion,
    isLoading,
    error,
    isInitialized,
    fetchEvidenceAssertions,
    fetchEvidenceAssertion,
    createEvidenceAssertion,
    updateEvidenceAssertion,
    deleteEvidenceAssertion,
    setActiveEvidenceAssertion,
    initialize,
    clearError,
    // Helper methods
    getById: (id: number) => {
      return evidenceAssertions.find((evidenceAssertion: EvidenceAssertion) => evidenceAssertion.id === id);
    },
    // entity-specific helpers — filter evidence assertions by source
    getBySourceId: (sourceId: number) => {
      return evidenceAssertions.filter((evidenceAssertion: EvidenceAssertion) => evidenceAssertion.source_id === sourceId);
    },
    fetchWithFilters: async (filters: ListEvidenceAssertionsParams) => {
      return await fetchEvidenceAssertions(filters);
    },
    createWithData: async (data: CreateEvidenceAssertion) => {
      return await createEvidenceAssertion(data);
    },
    updateWithData: async (id: number, data: UpdateEvidenceAssertion) => {
      return await updateEvidenceAssertion(id, data);
    },
  };
}

export default useEvidenceAssertions;
