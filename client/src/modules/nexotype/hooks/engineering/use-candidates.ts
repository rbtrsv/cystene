'use client';

import { useContext } from 'react';
import { CandidateContext, CandidateContextType } from '@/modules/nexotype/providers/engineering/candidate-provider';
import { useCandidateStore } from '@/modules/nexotype/store/engineering/candidate.store';
import {
  type Candidate,
  type CreateCandidate,
  type UpdateCandidate,
} from '@/modules/nexotype/schemas/engineering/candidate.schemas';
import { ListCandidatesParams } from '@/modules/nexotype/service/engineering/candidate.service';

/**
 * Hook to use the candidate context
 * @throws Error if used outside of a CandidateProvider
 */
export function useCandidateContext(): CandidateContextType {
  const context = useContext(CandidateContext);

  if (!context) {
    throw new Error('useCandidateContext must be used within a CandidateProvider');
  }

  return context;
}

/**
 * Custom hook that combines candidate context and store
 * to provide a simplified interface for candidate functionality
 *
 * @returns Candidate utilities and state
 */
export function useCandidates() {
  // Get data from candidate context
  const {
    candidates,
    activeCandidateId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveCandidate,
    clearError: clearContextError,
  } = useCandidateContext();

  // Get additional actions from candidate store
  const {
    fetchCandidates,
    fetchCandidate,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useCandidateStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active candidate
  const activeCandidate = candidates.find((item: Candidate) => item.id === activeCandidateId) || null;

  return {
    // State
    candidates,
    activeCandidateId,
    activeCandidate,
    isLoading,
    error,
    isInitialized,

    // Candidate actions
    fetchCandidates,
    fetchCandidate,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    setActiveCandidate,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return candidates.find((item: Candidate) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListCandidatesParams) => {
      return await fetchCandidates(filters);
    },
    createWithData: async (data: CreateCandidate) => {
      return await createCandidate(data);
    },
    updateWithData: async (id: number, data: UpdateCandidate) => {
      return await updateCandidate(id, data);
    },
  };
}

export default useCandidates;
