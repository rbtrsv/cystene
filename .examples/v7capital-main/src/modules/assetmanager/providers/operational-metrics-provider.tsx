'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useOperationalMetricsStore } from '../store/operational-metrics.store';
import { type OperationalMetrics } from '../schemas/operational-metrics.schemas';

/**
 * Context type for the operational metrics provider
 */
export interface OperationalMetricsContextType {
  // State
  operationalMetrics: OperationalMetrics[];
  selectedOperationalMetric: OperationalMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOperationalMetrics: (companyId?: number) => Promise<boolean>;
  fetchOperationalMetric: (id: number) => Promise<boolean>;
  setSelectedOperationalMetric: (operationalMetric: OperationalMetrics | null) => void;
  clearError: () => void;
}

// Create the context
export const OperationalMetricsContext = createContext<OperationalMetricsContextType | null>(null);

/**
 * Provider component for operational metrics-related state and actions
 */
export function OperationalMetricsProvider({ 
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
    operationalMetrics,
    selectedOperationalMetric,
    isLoading,
    error,
    fetchOperationalMetrics,
    fetchOperationalMetric,
    setSelectedOperationalMetric,
    clearError
  } = useOperationalMetricsStore();
  
  // Fetch operational metrics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchOperationalMetrics(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching operational metrics:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchOperationalMetrics]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OperationalMetricsContextType>(() => ({
    operationalMetrics,
    selectedOperationalMetric,
    isLoading,
    error,
    fetchOperationalMetrics,
    fetchOperationalMetric,
    setSelectedOperationalMetric,
    clearError
  }), [
    operationalMetrics,
    selectedOperationalMetric,
    isLoading,
    error,
    fetchOperationalMetrics,
    fetchOperationalMetric,
    setSelectedOperationalMetric,
    clearError
  ]);
  
  return (
    <OperationalMetricsContext.Provider value={contextValue}>
      {children}
    </OperationalMetricsContext.Provider>
  );
}

/**
 * Hook to use the operational metrics context
 * @throws Error if used outside of a OperationalMetricsProvider
 */
export function useOperationalMetricsContext(): OperationalMetricsContextType {
  const context = useContext(OperationalMetricsContext);
  
  if (!context) {
    throw new Error('useOperationalMetricsContext must be used within a OperationalMetricsProvider');
  }
  
  return context;
}