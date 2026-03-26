'use client';

import { useContext } from 'react';
import { HoldingContext, HoldingContextType } from '../../providers/holding/holding-provider';
import { useHoldingStore } from '../../store/holding/holding.store';
import {
  type Holding,
  type CreateHolding,
  type UpdateHolding,
} from '../../schemas/holding/holding.schemas';
import { ListHoldingsParams } from '../../service/holding/holding.service';

/**
 * Hook to use the holdings context
 * @throws Error if used outside of the provider
 */
export function useHoldingContext(): HoldingContextType {
  const context = useContext(HoldingContext);

  if (!context) {
    throw new Error('useHoldingContext must be used within a HoldingProvider');
  }

  return context;
}

/**
 * Custom hook that combines holdings context and store
 * to provide a simplified interface for holdings functionality
 *
 * @returns Holdings utilities and state
 */
export function useHoldings() {
  // Get data from holding context
  const {
    holdings,
    activeHoldingId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveHolding,
    clearError: clearContextError,
  } = useHoldingContext();

  // Get additional actions from holding store
  const {
    fetchHoldings,
    fetchHolding,
    createHolding,
    updateHolding,
    deleteHolding,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useHoldingStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active holding
  const activeHolding = holdings.find((item: Holding) => item.id === activeHoldingId) || null;

  return {
    // State
    holdings,
    activeHoldingId,
    activeHolding,
    isLoading,
    error,
    isInitialized,

    // Holding actions
    fetchHoldings,
    fetchHolding,
    createHolding,
    updateHolding,
    deleteHolding,
    setActiveHolding,
    initialize,
    clearError,

    // Helper methods
    getHoldingById: (id: number) => {
      return holdings.find((item: Holding) => item.id === id);
    },
    getHoldingsByEntity: (entityId: number) => {
      return holdings.filter((item: Holding) => item.entity_id === entityId);
    },
    getHoldingsByTargetEntity: (targetEntityId: number) => {
      return holdings.filter((item: Holding) => item.target_entity_id === targetEntityId);
    },

    // Convenience wrapper functions
    fetchHoldingsWithFilters: async (filters: ListHoldingsParams) => {
      return await fetchHoldings(filters);
    },
    createHoldingWithData: async (data: CreateHolding) => {
      return await createHolding(data);
    },
    updateHoldingWithData: async (id: number, data: UpdateHolding) => {
      return await updateHolding(id, data);
    },
  };
}

export default useHoldings;
