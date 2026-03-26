'use client';

import { useContext } from 'react';
import { FeeContext, FeeContextType } from '../../providers/captable/fee-provider';
import { useFeeStore } from '../../store/captable/fee.store';
import {
  type Fee,
  type CreateFee,
  type UpdateFee,
  type FeeType
} from '../../schemas/captable/fee.schemas';
import { ListFeesParams } from '../../service/captable/fee.service';

/**
 * Hook to use the fee context
 * @throws Error if used outside of a FeeProvider
 */
export function useFeeContext(): FeeContextType {
  const context = useContext(FeeContext);

  if (!context) {
    throw new Error('useFeeContext must be used within a FeeProvider');
  }

  return context;
}

/**
 * Custom hook that combines fee context and store
 * to provide a simplified interface for fee functionality
 *
 * @returns Fee utilities and state
 */
export function useFees() {
  // Get data from fee context
  const {
    fees,
    activeFeeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveFee,
    clearError: clearContextError
  } = useFeeContext();

  // Get additional actions from fee store
  const {
    fetchFees,
    fetchFee,
    createFee,
    updateFee,
    deleteFee,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFeeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active fee
  const activeFee = fees.find((fee: Fee) => fee.id === activeFeeId) || null;

  return {
    // State
    fees,
    activeFeeId,
    activeFee,
    isLoading,
    error,
    isInitialized,

    // Fee actions
    fetchFees,
    fetchFee,
    createFee,
    updateFee,
    deleteFee,
    setActiveFee,
    initialize,
    clearError,

    // Helper methods
    getFeeById: (id: number) => {
      return fees.find((fee: Fee) => fee.id === id);
    },
    getFeesByEntity: (entityId: number) => {
      return fees.filter((fee: Fee) => fee.entity_id === entityId);
    },
    getFeesByType: (feeType: FeeType) => {
      return fees.filter((fee: Fee) => fee.fee_type === feeType);
    },
    getFeesByFundingRound: (fundingRoundId: number) => {
      return fees.filter((fee: Fee) => fee.funding_round_id === fundingRoundId);
    },

    // Convenience wrapper functions
    fetchFeesWithFilters: async (filters: ListFeesParams) => {
      return await fetchFees(filters);
    },
    createFeeWithData: async (data: CreateFee) => {
      return await createFee(data);
    },
    updateFeeWithData: async (id: number, data: UpdateFee) => {
      return await updateFee(id, data);
    }
  };
}

export default useFees;
