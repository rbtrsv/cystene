'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useKpisStore } from '../store/kpis.store';
import { type Kpi, type KpiValue, type KpiValueWithRelations } from '../schemas/kpis.schemas';

/**
 * Context type for the kpis provider
 */
export interface KpisContextType {
  // KPI Definitions State
  kpis: Kpi[];
  selectedKpi: Kpi | null;
  
  // KPI Values State
  kpiValues: KpiValueWithRelations[];
  selectedKpiValue: KpiValueWithRelations | null;
  
  // Common State
  isLoading: boolean;
  error: string | null;
  
  // KPI Definition Actions
  fetchKpis: (companyId?: number) => Promise<boolean>;
  fetchKpi: (id: number) => Promise<boolean>;
  setSelectedKpi: (kpi: Kpi | null) => void;
  
  // KPI Values Actions
  fetchAllKpiValues: (companyId?: number) => Promise<boolean>;
  fetchKpiValues: (kpiId: number) => Promise<boolean>;
  fetchKpiValue: (id: number) => Promise<boolean>;
  setSelectedKpiValue: (kpiValue: KpiValueWithRelations | null) => void;
  
  // Common Actions
  clearError: () => void;
}

// Create the context
export const KpisContext = createContext<KpisContextType | null>(null);

/**
 * Provider component for kpis-related state and actions
 */
export function KpisProvider({ 
  children,
  initialFetch = true,
  companyId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  companyId?: number;
}) {
  // Get state and actions from the store
  const {
    kpis,
    selectedKpi,
    kpiValues,
    selectedKpiValue,
    isLoading,
    error,
    fetchKpis,
    fetchKpi,
    fetchAllKpiValues,
    fetchKpiValues,
    fetchKpiValue,
    setSelectedKpi,
    setSelectedKpiValue,
    clearError
  } = useKpisStore();
  
  // Fetch kpis on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchKpis(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching kpis:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchKpis]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<KpisContextType>(() => ({
    kpis,
    selectedKpi,
    kpiValues,
    selectedKpiValue,
    isLoading,
    error,
    fetchKpis,
    fetchKpi,
    fetchAllKpiValues,
    fetchKpiValues,
    fetchKpiValue,
    setSelectedKpi,
    setSelectedKpiValue,
    clearError
  }), [
    kpis,
    selectedKpi,
    kpiValues,
    selectedKpiValue,
    isLoading,
    error,
    fetchKpis,
    fetchKpi,
    fetchAllKpiValues,
    fetchKpiValues,
    fetchKpiValue,
    setSelectedKpi,
    setSelectedKpiValue,
    clearError
  ]);
  
  return (
    <KpisContext.Provider value={contextValue}>
      {children}
    </KpisContext.Provider>
  );
}

/**
 * Hook to use the kpis context
 * @throws Error if used outside of a KpisProvider
 */
export function useKpisContext(): KpisContextType {
  const context = useContext(KpisContext);
  
  if (!context) {
    throw new Error('useKpisContext must be used within a KpisProvider');
  }
  
  return context;
}