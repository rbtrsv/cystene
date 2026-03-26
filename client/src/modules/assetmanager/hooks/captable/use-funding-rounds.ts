'use client';

import { useContext } from 'react';
import { FundingRoundContext, FundingRoundContextType } from '../../providers/captable/funding-round-provider';
import { useFundingRoundStore } from '../../store/captable/funding-round.store';
import {
  type FundingRound,
  type CreateFundingRound,
  type UpdateFundingRound,
  type RoundType
} from '../../schemas/captable/funding-round.schemas';
import { ListFundingRoundsParams } from '../../service/captable/funding-round.service';

/**
 * Hook to use the funding round context
 * @throws Error if used outside of a FundingRoundProvider
 */
export function useFundingRoundContext(): FundingRoundContextType {
  const context = useContext(FundingRoundContext);

  if (!context) {
    throw new Error('useFundingRoundContext must be used within a FundingRoundProvider');
  }

  return context;
}

/**
 * Custom hook that combines funding round context and store
 * to provide a simplified interface for funding round functionality
 *
 * @returns FundingRound utilities and state
 */
export function useFundingRounds() {
  // Get data from funding round context
  const {
    fundingRounds,
    activeFundingRoundId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveFundingRound,
    clearError: clearContextError
  } = useFundingRoundContext();

  // Get additional actions from funding round store
  const {
    fetchFundingRounds,
    fetchFundingRound,
    createFundingRound,
    updateFundingRound,
    deleteFundingRound,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFundingRoundStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active funding round
  const activeFundingRound = fundingRounds.find((round: FundingRound) => round.id === activeFundingRoundId) || null;

  return {
    // State
    fundingRounds,
    activeFundingRoundId,
    activeFundingRound,
    isLoading,
    error,
    isInitialized,

    // FundingRound actions
    fetchFundingRounds,
    fetchFundingRound,
    createFundingRound,
    updateFundingRound,
    deleteFundingRound,
    setActiveFundingRound,
    initialize,
    clearError,

    // Helper methods
    getFundingRoundById: (id: number) => {
      return fundingRounds.find((round: FundingRound) => round.id === id);
    },
    getFundingRoundName: (id: number) => {
      const round = fundingRounds.find((r: FundingRound) => r.id === id);
      return round ? round.name : 'Unknown Round';
    },
    getFundingRoundsByType: (roundType: RoundType) => {
      return fundingRounds.filter((r: FundingRound) => r.round_type === roundType);
    },
    getFundingRoundsByEntity: (entityId: number) => {
      return fundingRounds.filter((r: FundingRound) => r.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchFundingRoundsWithFilters: async (filters: ListFundingRoundsParams) => {
      return await fetchFundingRounds(filters);
    },
    createFundingRoundWithData: async (data: CreateFundingRound) => {
      return await createFundingRound(data);
    },
    updateFundingRoundWithData: async (id: number, data: UpdateFundingRound) => {
      return await updateFundingRound(id, data);
    }
  };
}

export default useFundingRounds;
