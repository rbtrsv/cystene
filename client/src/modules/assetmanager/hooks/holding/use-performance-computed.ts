'use client';

/**
 * Performance Computed Hooks
 *
 * React hooks for computed performance data (read-only).
 * Combines context and store for a simplified interface.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/performance_service.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */

import { useContext } from 'react';
import { PerformanceComputedContext, PerformanceComputedContextType } from '../../providers/holding/performance-computed-provider';

/**
 * Hook to use the performance computed context
 * @throws Error if used outside of the provider
 */
export function usePerformanceComputedContext(): PerformanceComputedContextType {
  const context = useContext(PerformanceComputedContext);

  if (!context) {
    throw new Error('usePerformanceComputedContext must be used within a PerformanceComputedProvider');
  }

  return context;
}

/**
 * Custom hook that provides computed performance functionality
 *
 * @returns Performance computed utilities and state
 */
export function usePerformanceComputed() {
  // Get data from performance computed context
  const {
    entityPerformance,
    holdingsPerformance,
    stakeholderReturns,
    isLoading,
    error,
    fetchEntityPerformance,
    fetchHoldingsPerformance,
    fetchStakeholderReturns,
    fetchAll,
    clearError,
    reset,
  } = usePerformanceComputedContext();

  return {
    // State
    entityPerformance,
    holdingsPerformance,
    stakeholderReturns,
    isLoading,
    error,

    // Actions
    fetchEntityPerformance,
    fetchHoldingsPerformance,
    fetchStakeholderReturns,
    fetchAll,
    clearError,
    reset,

    // Helper methods
    getHoldingPerformanceById: (holdingId: number) => {
      return holdingsPerformance.find((item) => item.holding_id === holdingId);
    },
    getStakeholderReturnById: (stakeholderId: number) => {
      return stakeholderReturns.find((item) => item.stakeholder_id === stakeholderId);
    },
  };
}

export default usePerformanceComputed;
