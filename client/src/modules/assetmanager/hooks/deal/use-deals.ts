'use client';

import { useContext } from 'react';
import { DealContext, DealContextType } from '../../providers/deal/deal-provider';
import { useDealStore } from '../../store/deal/deal.store';
import {
  type Deal,
  type CreateDeal,
  type UpdateDeal,
  type DealType,
  type DealStatus,
  type DealExecuteInput,
} from '../../schemas/deal/deal.schemas';
import { ListDealsParams } from '../../service/deal/deal.service';

/**
 * Hook to use the deals context
 * @throws Error if used outside of the provider
 */
export function useDealContext(): DealContextType {
  const context = useContext(DealContext);

  if (!context) {
    throw new Error('useDealContext must be used within a DealProvider');
  }

  return context;
}

/**
 * Custom hook that combines deals context and store
 * to provide a simplified interface for deals functionality
 *
 * @returns Deals utilities and state
 */
export function useDeals() {
  // Get data from deal context
  const {
    deals,
    activeDealId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDeal,
    clearError: clearContextError,
  } = useDealContext();

  // Get additional actions from deal store
  const {
    fetchDeals,
    fetchDeal,
    createDeal,
    updateDeal,
    deleteDeal,
    updateDealStatus,
    executeDeal,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDealStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active deal
  const activeDeal = deals.find((deal: Deal) => deal.id === activeDealId) || null;

  return {
    // State
    deals,
    activeDealId,
    activeDeal,
    isLoading,
    error,
    isInitialized,

    // Deal actions
    fetchDeals,
    fetchDeal,
    createDeal,
    updateDeal,
    deleteDeal,
    updateDealStatus,
    executeDeal,
    setActiveDeal,
    initialize,
    clearError,

    // Helper methods
    getDealById: (id: number) => {
      return deals.find((deal: Deal) => deal.id === id);
    },
    getDealsByEntity: (entityId: number) => {
      return deals.filter((deal: Deal) => deal.entity_id === entityId);
    },
    getDealsByType: (dealType: DealType) => {
      return deals.filter((deal: Deal) => deal.deal_type === dealType);
    },

    // Convenience wrapper functions
    fetchDealsWithFilters: async (filters: ListDealsParams) => {
      return await fetchDeals(filters);
    },
    createDealWithData: async (data: CreateDeal) => {
      return await createDeal(data);
    },
    updateDealWithData: async (id: number, data: UpdateDeal) => {
      return await updateDeal(id, data);
    },
  };
}

export default useDeals;
