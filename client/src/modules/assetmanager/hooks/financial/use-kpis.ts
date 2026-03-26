'use client';

import { useContext } from 'react';
import { KPIContext, KPIContextType } from '../../providers/financial/kpi-provider';
import { useKPIStore } from '../../store/financial/kpi.store';
import {
  type KPI,
  type CreateKPI,
  type UpdateKPI,
} from '../../schemas/financial/kpi.schemas';
import { ListKPIsParams } from '../../service/financial/kpi.service';

/**
 * Hook to use the KPIs context
 * @throws Error if used outside of the provider
 */
export function useKPIContext(): KPIContextType {
  const context = useContext(KPIContext);

  if (!context) {
    throw new Error('useKPIContext must be used within a KPIProvider');
  }

  return context;
}

/**
 * Custom hook that combines KPIs context and store
 * to provide a simplified interface for KPIs functionality
 *
 * @returns KPIs utilities and state
 */
export function useKPIs() {
  // Get data from KPI context
  const {
    kpis,
    activeKPIId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveKPI,
    clearError: clearContextError,
  } = useKPIContext();

  // Get additional actions from KPI store
  const {
    fetchKPIs,
    fetchKPI,
    createKPI,
    updateKPI,
    deleteKPI,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useKPIStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active KPI
  const activeKPI = kpis.find((item: KPI) => item.id === activeKPIId) || null;

  return {
    // State
    kpis,
    activeKPIId,
    activeKPI,
    isLoading,
    error,
    isInitialized,

    // KPI actions
    fetchKPIs,
    fetchKPI,
    createKPI,
    updateKPI,
    deleteKPI,
    setActiveKPI,
    initialize,
    clearError,

    // Helper methods
    getKPIById: (id: number) => {
      return kpis.find((item: KPI) => item.id === id);
    },
    getKPIsByEntity: (entityId: number) => {
      return kpis.filter((item: KPI) => item.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchKPIsWithFilters: async (filters: ListKPIsParams) => {
      return await fetchKPIs(filters);
    },
    createKPIWithData: async (data: CreateKPI) => {
      return await createKPI(data);
    },
    updateKPIWithData: async (id: number, data: UpdateKPI) => {
      return await updateKPI(id, data);
    },
  };
}

export default useKPIs;
