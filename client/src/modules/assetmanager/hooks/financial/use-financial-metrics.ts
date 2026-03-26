'use client';

import { useContext } from 'react';
import { FinancialMetricsContext, FinancialMetricsContextType } from '../../providers/financial/financial-metrics-provider';
import { useFinancialMetricsStore } from '../../store/financial/financial-metrics.store';
import {
  type FinancialMetrics,
  type CreateFinancialMetrics,
  type UpdateFinancialMetrics,
} from '../../schemas/financial/financial-metrics.schemas';
import { ListFinancialMetricsParams } from '../../service/financial/financial-metrics.service';

/**
 * Hook to use the financial metrics context
 * @throws Error if used outside of the provider
 */
export function useFinancialMetricsContext(): FinancialMetricsContextType {
  const context = useContext(FinancialMetricsContext);

  if (!context) {
    throw new Error('useFinancialMetricsContext must be used within a FinancialMetricsProvider');
  }

  return context;
}

/**
 * Custom hook that combines financial metrics context and store
 * to provide a simplified interface for financial metrics functionality
 *
 * @returns Financial Metrics utilities and state
 */
export function useFinancialMetricsList() {
  // Get data from financial metrics context
  const {
    financialMetrics,
    activeFinancialMetricsId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveFinancialMetrics,
    clearError: clearContextError,
  } = useFinancialMetricsContext();

  // Get additional actions from financial metrics store
  const {
    fetchFinancialMetricsList,
    fetchFinancialMetrics,
    createFinancialMetrics,
    updateFinancialMetrics,
    deleteFinancialMetrics,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useFinancialMetricsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active financial metrics record
  const activeFinancialMetrics = financialMetrics.find((item: FinancialMetrics) => item.id === activeFinancialMetricsId) || null;

  return {
    // State
    financialMetrics,
    activeFinancialMetricsId,
    activeFinancialMetrics,
    isLoading,
    error,
    isInitialized,

    // Financial metrics actions
    fetchFinancialMetricsList,
    fetchFinancialMetrics,
    createFinancialMetrics,
    updateFinancialMetrics,
    deleteFinancialMetrics,
    setActiveFinancialMetrics,
    initialize,
    clearError,

    // Helper methods
    getFinancialMetricsById: (id: number) => {
      return financialMetrics.find((item: FinancialMetrics) => item.id === id);
    },
    getFinancialMetricsByEntity: (entityId: number) => {
      return financialMetrics.filter((item: FinancialMetrics) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchFinancialMetricsListWithFilters: async (filters: ListFinancialMetricsParams) => {
      return await fetchFinancialMetricsList(filters);
    },
    createFinancialMetricsWithData: async (data: CreateFinancialMetrics) => {
      return await createFinancialMetrics(data);
    },
    updateFinancialMetricsWithData: async (id: number, data: UpdateFinancialMetrics) => {
      return await updateFinancialMetrics(id, data);
    },
  };
}

export default useFinancialMetricsList;
