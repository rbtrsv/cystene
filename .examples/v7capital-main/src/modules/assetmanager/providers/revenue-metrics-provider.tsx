'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useRevenueMetricsStore } from '../store/revenue-metrics.store';
import { type RevenueMetrics } from '../schemas/revenue-metrics.schemas';

/**
 * Context type for the revenue metrics provider
 */
export interface RevenueMetricsContextType {
  // State
  revenueMetrics: RevenueMetrics[];
  selectedRevenueMetric: RevenueMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRevenueMetrics: (companyId?: number) => Promise<boolean>;
  fetchRevenueMetric: (id: number) => Promise<boolean>;
  setSelectedRevenueMetric: (revenueMetric: RevenueMetrics | null) => void;
  clearError: () => void;
}

// Create the context
export const RevenueMetricsContext = createContext<RevenueMetricsContextType | null>(null);

/**
 * Provider component for revenue metrics-related state and actions
 */
export function RevenueMetricsProvider({ 
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
    revenueMetrics,
    selectedRevenueMetric,
    isLoading,
    error,
    fetchRevenueMetrics,
    fetchRevenueMetric,
    setSelectedRevenueMetric,
    clearError
  } = useRevenueMetricsStore();
  
  // Fetch revenue metrics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchRevenueMetrics(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching revenue metrics:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchRevenueMetrics]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RevenueMetricsContextType>(() => ({
    revenueMetrics,
    selectedRevenueMetric,
    isLoading,
    error,
    fetchRevenueMetrics,
    fetchRevenueMetric,
    setSelectedRevenueMetric,
    clearError
  }), [
    revenueMetrics,
    selectedRevenueMetric,
    isLoading,
    error,
    fetchRevenueMetrics,
    fetchRevenueMetric,
    setSelectedRevenueMetric,
    clearError
  ]);
  
  return (
    <RevenueMetricsContext.Provider value={contextValue}>
      {children}
    </RevenueMetricsContext.Provider>
  );
}

/**
 * Hook to use the revenue metrics context
 * @throws Error if used outside of a RevenueMetricsProvider
 */
export function useRevenueMetricsContext(): RevenueMetricsContextType {
  const context = useContext(RevenueMetricsContext);
  
  if (!context) {
    throw new Error('useRevenueMetricsContext must be used within a RevenueMetricsProvider');
  }
  
  return context;
}