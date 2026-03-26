'use client';

import { useContext } from 'react';
import { ValuationContext, ValuationContextType } from '../../providers/holding/valuation-provider';
import { useValuationStore } from '../../store/holding/valuation.store';
import {
  type Valuation,
  type CreateValuation,
  type UpdateValuation,
} from '../../schemas/holding/valuation.schemas';
import { ListValuationsParams } from '../../service/holding/valuation.service';

/**
 * Hook to use the valuations context
 * @throws Error if used outside of the provider
 */
export function useValuationContext(): ValuationContextType {
  const context = useContext(ValuationContext);

  if (!context) {
    throw new Error('useValuationContext must be used within a ValuationProvider');
  }

  return context;
}

/**
 * Custom hook that combines valuations context and store
 * to provide a simplified interface for valuations functionality
 *
 * @returns Valuations utilities and state
 */
export function useValuations() {
  // Get data from valuation context
  const {
    valuations,
    activeValuationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveValuation,
    clearError: clearContextError,
  } = useValuationContext();

  // Get additional actions from valuation store
  const {
    fetchValuations,
    fetchValuation,
    createValuation,
    updateValuation,
    deleteValuation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useValuationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active valuation
  const activeValuation = valuations.find((item: Valuation) => item.id === activeValuationId) || null;

  return {
    // State
    valuations,
    activeValuationId,
    activeValuation,
    isLoading,
    error,
    isInitialized,

    // Valuation actions
    fetchValuations,
    fetchValuation,
    createValuation,
    updateValuation,
    deleteValuation,
    setActiveValuation,
    initialize,
    clearError,

    // Helper methods
    getValuationById: (id: number) => {
      return valuations.find((item: Valuation) => item.id === id);
    },
    getValuationsByEntity: (entityId: number) => {
      return valuations.filter((item: Valuation) => item.entity_id === entityId);
    },
    getValuationsByFundingRound: (fundingRoundId: number) => {
      return valuations.filter((item: Valuation) => item.funding_round_id === fundingRoundId);
    },

    // Convenience wrapper functions
    fetchValuationsWithFilters: async (filters: ListValuationsParams) => {
      return await fetchValuations(filters);
    },
    createValuationWithData: async (data: CreateValuation) => {
      return await createValuation(data);
    },
    updateValuationWithData: async (id: number, data: UpdateValuation) => {
      return await updateValuation(id, data);
    },
  };
}

export default useValuations;
