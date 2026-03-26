'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCustomerMetricsStore } from '../store/customer-metrics.store';
import { type CustomerMetrics } from '../schemas/customer-metrics.schemas';

/**
 * Context type for the customer metrics provider
 */
export interface CustomerMetricsContextType {
  // State
  customerMetrics: CustomerMetrics[];
  selectedCustomerMetric: CustomerMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomerMetrics: (companyId?: number) => Promise<boolean>;
  fetchCustomerMetric: (id: number) => Promise<boolean>;
  setSelectedCustomerMetric: (customerMetric: CustomerMetrics | null) => void;
  clearError: () => void;
}

// Create the context
export const CustomerMetricsContext = createContext<CustomerMetricsContextType | null>(null);

/**
 * Provider component for customer metrics-related state and actions
 */
export function CustomerMetricsProvider({ 
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
    customerMetrics,
    selectedCustomerMetric,
    isLoading,
    error,
    fetchCustomerMetrics,
    fetchCustomerMetric,
    setSelectedCustomerMetric,
    clearError
  } = useCustomerMetricsStore();
  
  // Fetch customer metrics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchCustomerMetrics(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching customer metrics:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchCustomerMetrics]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<CustomerMetricsContextType>(() => ({
    customerMetrics,
    selectedCustomerMetric,
    isLoading,
    error,
    fetchCustomerMetrics,
    fetchCustomerMetric,
    setSelectedCustomerMetric,
    clearError
  }), [
    customerMetrics,
    selectedCustomerMetric,
    isLoading,
    error,
    fetchCustomerMetrics,
    fetchCustomerMetric,
    setSelectedCustomerMetric,
    clearError
  ]);
  
  return (
    <CustomerMetricsContext.Provider value={contextValue}>
      {children}
    </CustomerMetricsContext.Provider>
  );
}

/**
 * Hook to use the customer metrics context
 * @throws Error if used outside of a CustomerMetricsProvider
 */
export function useCustomerMetricsContext(): CustomerMetricsContextType {
  const context = useContext(CustomerMetricsContext);
  
  if (!context) {
    throw new Error('useCustomerMetricsContext must be used within a CustomerMetricsProvider');
  }
  
  return context;
}