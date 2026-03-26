'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useFinancialRatiosStore } from '../store/financial-ratios.store';
import { type FinancialRatios } from '../schemas/financial-ratios.schemas';

/**
 * Context type for the financial ratios provider
 */
export interface FinancialRatiosContextType {
  // State
  financialRatios: FinancialRatios[];
  selectedFinancialRatio: FinancialRatios | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFinancialRatios: (companyId?: number) => Promise<boolean>;
  fetchFinancialRatio: (id: number) => Promise<boolean>;
  setSelectedFinancialRatio: (financialRatio: FinancialRatios | null) => void;
  clearError: () => void;
}

// Create the context
export const FinancialRatiosContext = createContext<FinancialRatiosContextType | null>(null);

/**
 * Provider component for financial ratios-related state and actions
 */
export function FinancialRatiosProvider({ 
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
    financialRatios,
    selectedFinancialRatio,
    isLoading,
    error,
    fetchFinancialRatios,
    fetchFinancialRatio,
    setSelectedFinancialRatio,
    clearError
  } = useFinancialRatiosStore();
  
  // Fetch financial ratios on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchFinancialRatios(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching financial ratios:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchFinancialRatios]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FinancialRatiosContextType>(() => ({
    financialRatios,
    selectedFinancialRatio,
    isLoading,
    error,
    fetchFinancialRatios,
    fetchFinancialRatio,
    setSelectedFinancialRatio,
    clearError
  }), [
    financialRatios,
    selectedFinancialRatio,
    isLoading,
    error,
    fetchFinancialRatios,
    fetchFinancialRatio,
    setSelectedFinancialRatio,
    clearError
  ]);
  
  return (
    <FinancialRatiosContext.Provider value={contextValue}>
      {children}
    </FinancialRatiosContext.Provider>
  );
}

/**
 * Hook to use the financial ratios context
 * @throws Error if used outside of a FinancialRatiosProvider
 */
export function useFinancialRatiosContext(): FinancialRatiosContextType {
  const context = useContext(FinancialRatiosContext);
  
  if (!context) {
    throw new Error('useFinancialRatiosContext must be used within a FinancialRatiosProvider');
  }
  
  return context;
}