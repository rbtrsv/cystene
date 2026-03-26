'use client';

import { useContext } from 'react';
import { HoldingCashFlowContext, HoldingCashFlowContextType } from '../../providers/holding/holding-cash-flow-provider';
import { useHoldingCashFlowStore } from '../../store/holding/holding-cash-flow.store';
import {
  type HoldingCashFlow,
  type CreateHoldingCashFlow,
  type UpdateHoldingCashFlow,
} from '../../schemas/holding/holding-cash-flow.schemas';
import { ListHoldingCashFlowsParams } from '../../service/holding/holding-cash-flow.service';

/**
 * Hook to use the holding cash flows context
 * @throws Error if used outside of the provider
 */
export function useHoldingCashFlowContext(): HoldingCashFlowContextType {
  const context = useContext(HoldingCashFlowContext);

  if (!context) {
    throw new Error('useHoldingCashFlowContext must be used within a HoldingCashFlowProvider');
  }

  return context;
}

/**
 * Custom hook that combines holding cash flows context and store
 * to provide a simplified interface for holding cash flows functionality
 *
 * @returns Holding Cash Flows utilities and state
 */
export function useHoldingCashFlows() {
  // Get data from holding cash flow context
  const {
    holdingCashFlows,
    activeHoldingCashFlowId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveHoldingCashFlow,
    clearError: clearContextError,
  } = useHoldingCashFlowContext();

  // Get additional actions from holding cash flow store
  const {
    fetchHoldingCashFlows,
    fetchHoldingCashFlow,
    createHoldingCashFlow,
    updateHoldingCashFlow,
    deleteHoldingCashFlow,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useHoldingCashFlowStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active holding cash flow
  const activeHoldingCashFlow = holdingCashFlows.find((item: HoldingCashFlow) => item.id === activeHoldingCashFlowId) || null;

  return {
    // State
    holdingCashFlows,
    activeHoldingCashFlowId,
    activeHoldingCashFlow,
    isLoading,
    error,
    isInitialized,

    // Holding cash flow actions
    fetchHoldingCashFlows,
    fetchHoldingCashFlow,
    createHoldingCashFlow,
    updateHoldingCashFlow,
    deleteHoldingCashFlow,
    setActiveHoldingCashFlow,
    initialize,
    clearError,

    // Helper methods
    getHoldingCashFlowById: (id: number) => {
      return holdingCashFlows.find((item: HoldingCashFlow) => item.id === id);
    },
    getHoldingCashFlowsByHolding: (holdingId: number) => {
      return holdingCashFlows.filter((item: HoldingCashFlow) => item.holding_id === holdingId);
    },
    getHoldingCashFlowsByEntity: (entityId: number) => {
      return holdingCashFlows.filter((item: HoldingCashFlow) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchHoldingCashFlowsWithFilters: async (filters: ListHoldingCashFlowsParams) => {
      return await fetchHoldingCashFlows(filters);
    },
    createHoldingCashFlowWithData: async (data: CreateHoldingCashFlow) => {
      return await createHoldingCashFlow(data);
    },
    updateHoldingCashFlowWithData: async (id: number, data: UpdateHoldingCashFlow) => {
      return await updateHoldingCashFlow(id, data);
    },
  };
}

export default useHoldingCashFlows;
