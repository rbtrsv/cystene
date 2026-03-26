'use client';

import { useContext } from 'react';
import { DealCommitmentContext, DealCommitmentContextType } from '../../providers/deal/deal-commitment-provider';
import { useDealCommitmentStore } from '../../store/deal/deal-commitment.store';
import {
  type DealCommitment,
  type CreateDealCommitment,
  type UpdateDealCommitment,
  type CommitmentType,
} from '../../schemas/deal/deal-commitment.schemas';
import { ListDealCommitmentsParams } from '../../service/deal/deal-commitment.service';

/**
 * Hook to use the deal commitments context
 * @throws Error if used outside of the provider
 */
export function useDealCommitmentContext(): DealCommitmentContextType {
  const context = useContext(DealCommitmentContext);

  if (!context) {
    throw new Error('useDealCommitmentContext must be used within a DealCommitmentProvider');
  }

  return context;
}

/**
 * Custom hook that combines deal commitments context and store
 * to provide a simplified interface for deal commitments functionality
 *
 * @returns Deal Commitments utilities and state
 */
export function useDealCommitments() {
  // Get data from deal commitment context
  const {
    dealCommitments,
    activeDealCommitmentId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDealCommitment,
    clearError: clearContextError,
  } = useDealCommitmentContext();

  // Get additional actions from deal commitment store
  const {
    fetchDealCommitments,
    fetchDealCommitment,
    createDealCommitment,
    updateDealCommitment,
    deleteDealCommitment,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDealCommitmentStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active deal commitment
  const activeDealCommitment = dealCommitments.find(
    (commitment: DealCommitment) => commitment.id === activeDealCommitmentId
  ) || null;

  return {
    // State
    dealCommitments,
    activeDealCommitmentId,
    activeDealCommitment,
    isLoading,
    error,
    isInitialized,

    // Deal commitment actions
    fetchDealCommitments,
    fetchDealCommitment,
    createDealCommitment,
    updateDealCommitment,
    deleteDealCommitment,
    setActiveDealCommitment,
    initialize,
    clearError,

    // Helper methods
    getDealCommitmentById: (id: number) => {
      return dealCommitments.find((commitment: DealCommitment) => commitment.id === id);
    },
    getCommitmentsByDeal: (dealId: number) => {
      return dealCommitments.filter((commitment: DealCommitment) => commitment.deal_id === dealId);
    },
    getCommitmentsByEntity: (entityId: number) => {
      return dealCommitments.filter((commitment: DealCommitment) => commitment.entity_id === entityId);
    },
    getCommitmentsByType: (commitmentType: CommitmentType) => {
      return dealCommitments.filter((commitment: DealCommitment) => commitment.commitment_type === commitmentType);
    },

    // Convenience wrapper functions
    fetchCommitmentsWithFilters: async (filters: ListDealCommitmentsParams) => {
      return await fetchDealCommitments(filters);
    },
    createCommitmentWithData: async (data: CreateDealCommitment) => {
      return await createDealCommitment(data);
    },
    updateCommitmentWithData: async (id: number, data: UpdateDealCommitment) => {
      return await updateDealCommitment(id, data);
    },
  };
}

export default useDealCommitments;
