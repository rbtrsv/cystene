'use client';

import { useContext } from 'react';
import { CommitmentContext, CommitmentContextType } from '../../providers/captable/commitment-provider';
import { useCommitmentStore } from '../../store/captable/commitment.store';
import {
  type Commitment,
  type CommitmentDetail,
  type CreateCommitment,
  type RespondCommitment,
  type ReviewCommitment,
  type CommitmentStatus,
  isPendingResponse,
  isApproved,
  isPendingReview,
  isPassed,
  isRejected,
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_TYPE_LABELS,
  calculateProRataAmount,
} from '../../schemas/captable/commitment.schemas';
import { ListCommitmentsParams } from '../../service/captable/commitment.service';

/**
 * Hook to use the commitment context
 * @throws Error if used outside of a CommitmentProvider
 */
export function useCommitmentContext(): CommitmentContextType {
  const context = useContext(CommitmentContext);

  if (!context) {
    throw new Error('useCommitmentContext must be used within a CommitmentProvider');
  }

  return context;
}

/**
 * Custom hook that combines commitment context and store
 * to provide a simplified interface for commitment functionality
 *
 * @returns Commitment utilities and state
 */
export function useCommitments() {
  // Get data from commitment context
  const {
    commitments,
    activeCommitmentId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveCommitment,
    clearError: clearContextError
  } = useCommitmentContext();

  // Get additional actions from commitment store
  const {
    fetchCommitments,
    fetchCommitment,
    createCommitment,
    respondToCommitment,
    reviewCommitment,
    generateTransaction,
    deleteCommitment,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useCommitmentStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active commitment
  const activeCommitment = commitments.find((c: CommitmentDetail) => c.id === activeCommitmentId) || null;

  return {
    // State
    commitments,
    activeCommitmentId,
    activeCommitment,
    isLoading,
    error,
    isInitialized,

    // Commitment actions
    fetchCommitments,
    fetchCommitment,
    createCommitment,
    respondToCommitment,
    reviewCommitment,
    generateTransaction,
    deleteCommitment,
    setActiveCommitment,
    initialize,
    clearError,

    // Helper methods
    getCommitmentById: (id: number) => {
      return commitments.find((c: CommitmentDetail) => c.id === id);
    },
    getCommitmentsByRound: (fundingRoundId: number) => {
      return commitments.filter((c: CommitmentDetail) => c.funding_round_id === fundingRoundId);
    },
    getCommitmentsByStakeholder: (stakeholderId: number) => {
      return commitments.filter((c: CommitmentDetail) => c.stakeholder_id === stakeholderId);
    },
    getCommitmentsByStatus: (status: CommitmentStatus) => {
      return commitments.filter((c: CommitmentDetail) => c.status === status);
    },

    // Helpers re-exported from schema for convenience
    isPendingResponse,
    isApproved,
    isPendingReview,
    isPassed,
    isRejected,
    COMMITMENT_STATUS_LABELS,
    COMMITMENT_TYPE_LABELS,
    calculateProRataAmount,

    // Convenience wrapper functions
    fetchCommitmentsWithFilters: async (filters: ListCommitmentsParams) => {
      return await fetchCommitments(filters);
    },
    createCommitmentWithData: async (data: CreateCommitment, raise_amount: number) => {
      return await createCommitment(data, raise_amount);
    },
    respondToCommitmentWithData: async (id: number, data: RespondCommitment) => {
      return await respondToCommitment(id, data);
    },
    reviewCommitmentWithData: async (id: number, data: ReviewCommitment) => {
      return await reviewCommitment(id, data);
    }
  };
}

export default useCommitments;
