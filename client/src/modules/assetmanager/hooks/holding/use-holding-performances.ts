'use client';

import { useContext } from 'react';
import { HoldingPerformanceContext, HoldingPerformanceContextType } from '../../providers/holding/holding-performance-provider';
import { useHoldingPerformanceStore } from '../../store/holding/holding-performance.store';
import {
  type HoldingPerformance,
  type CreateHoldingPerformance,
  type UpdateHoldingPerformance,
} from '../../schemas/holding/holding-performance.schemas';
import { ListHoldingPerformancesParams } from '../../service/holding/holding-performance.service';

/**
 * Hook to use the holding performances context
 * @throws Error if used outside of the provider
 */
export function useHoldingPerformanceContext(): HoldingPerformanceContextType {
  const context = useContext(HoldingPerformanceContext);

  if (!context) {
    throw new Error('useHoldingPerformanceContext must be used within a HoldingPerformanceProvider');
  }

  return context;
}

/**
 * Custom hook that combines holding performances context and store
 * to provide a simplified interface for holding performances functionality
 *
 * @returns Holding Performances utilities and state
 */
export function useHoldingPerformances() {
  // Get data from holding performance context
  const {
    holdingPerformances,
    activeHoldingPerformanceId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveHoldingPerformance,
    clearError: clearContextError,
  } = useHoldingPerformanceContext();

  // Get additional actions from holding performance store
  const {
    fetchHoldingPerformances,
    fetchHoldingPerformance,
    createHoldingPerformance,
    updateHoldingPerformance,
    deleteHoldingPerformance,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useHoldingPerformanceStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active holding performance
  const activeHoldingPerformance = holdingPerformances.find((item: HoldingPerformance) => item.id === activeHoldingPerformanceId) || null;

  return {
    // State
    holdingPerformances,
    activeHoldingPerformanceId,
    activeHoldingPerformance,
    isLoading,
    error,
    isInitialized,

    // Holding performance actions
    fetchHoldingPerformances,
    fetchHoldingPerformance,
    createHoldingPerformance,
    updateHoldingPerformance,
    deleteHoldingPerformance,
    setActiveHoldingPerformance,
    initialize,
    clearError,

    // Helper methods
    getHoldingPerformanceById: (id: number) => {
      return holdingPerformances.find((item: HoldingPerformance) => item.id === id);
    },
    getHoldingPerformancesByEntity: (entityId: number) => {
      return holdingPerformances.filter((item: HoldingPerformance) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchHoldingPerformancesWithFilters: async (filters: ListHoldingPerformancesParams) => {
      return await fetchHoldingPerformances(filters);
    },
    createHoldingPerformanceWithData: async (data: CreateHoldingPerformance) => {
      return await createHoldingPerformance(data);
    },
    updateHoldingPerformanceWithData: async (id: number, data: UpdateHoldingPerformance) => {
      return await updateHoldingPerformance(id, data);
    },
  };
}

export default useHoldingPerformances;
