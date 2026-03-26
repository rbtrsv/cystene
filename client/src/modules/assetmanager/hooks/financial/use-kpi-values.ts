'use client';

import { useContext } from 'react';
import { KPIValueContext, KPIValueContextType } from '../../providers/financial/kpi-value-provider';
import { useKPIValueStore } from '../../store/financial/kpi-value.store';
import {
  type KPIValue,
  type CreateKPIValue,
  type UpdateKPIValue,
} from '../../schemas/financial/kpi-value.schemas';
import { ListKPIValuesParams } from '../../service/financial/kpi-value.service';

/**
 * Hook to use the KPI values context
 * @throws Error if used outside of the provider
 */
export function useKPIValueContext(): KPIValueContextType {
  const context = useContext(KPIValueContext);

  if (!context) {
    throw new Error('useKPIValueContext must be used within a KPIValueProvider');
  }

  return context;
}

/**
 * Custom hook that combines KPI values context and store
 * to provide a simplified interface for KPI values functionality
 *
 * @returns KPI Values utilities and state
 */
export function useKPIValues() {
  // Get data from KPI value context
  const {
    kpiValues,
    activeKPIValueId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveKPIValue,
    clearError: clearContextError,
  } = useKPIValueContext();

  // Get additional actions from KPI value store
  const {
    fetchKPIValues,
    fetchKPIValue,
    createKPIValue,
    updateKPIValue,
    deleteKPIValue,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useKPIValueStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active KPI value
  const activeKPIValue = kpiValues.find((item: KPIValue) => item.id === activeKPIValueId) || null;

  return {
    // State
    kpiValues,
    activeKPIValueId,
    activeKPIValue,
    isLoading,
    error,
    isInitialized,

    // KPI value actions
    fetchKPIValues,
    fetchKPIValue,
    createKPIValue,
    updateKPIValue,
    deleteKPIValue,
    setActiveKPIValue,
    initialize,
    clearError,

    // Helper methods
    getKPIValueById: (id: number) => {
      return kpiValues.find((item: KPIValue) => item.id === id);
    },
    getKPIValuesByKPI: (kpiId: number) => {
      return kpiValues.filter((item: KPIValue) => item.kpi_id === kpiId);
    },

    // Convenience wrapper functions
    fetchKPIValuesWithFilters: async (filters: ListKPIValuesParams) => {
      return await fetchKPIValues(filters);
    },
    createKPIValueWithData: async (data: CreateKPIValue) => {
      return await createKPIValue(data);
    },
    updateKPIValueWithData: async (id: number, data: UpdateKPIValue) => {
      return await updateKPIValue(id, data);
    },
  };
}

export default useKPIValues;
