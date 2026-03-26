'use client';

import { useContext } from 'react';
import { AnalyticsContext, AnalyticsContextType } from '../providers/data-provider';
import { useAnalyticsStore } from '../store/data.store';

/**
 * Hook to use the analytics context
 * @throws Error if used outside of an AnalyticsProvider
 */
export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }

  return context;
}

/**
 * Custom hook that combines analytics context and store
 * to provide a simplified interface for analytics functionality
 *
 * @returns Analytics utilities and state
 */
export function useAnalytics() {
  // Get data from analytics context
  const {
    connectionStats,
    isLoading: contextLoading,
    error: contextError,
    clearError: clearContextError,
  } = useAnalyticsContext();

  // Get additional actions from analytics store
  const {
    fetchConnectionStats,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
    reset,
  } = useAnalyticsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    connectionStats,
    isLoading,
    error,

    // Analytics actions
    fetchConnectionStats,
    clearError,
    reset,

    // Helper methods
    hasStats: !!connectionStats,
    productsCount: connectionStats?.products_count ?? 0,
    ordersCount: connectionStats?.orders_count ?? 0,
    lastSync: connectionStats?.last_sync ?? null,
    dataFreshnessDays: connectionStats?.data_freshness_days ?? null,
  };
}

export default useAnalytics;
