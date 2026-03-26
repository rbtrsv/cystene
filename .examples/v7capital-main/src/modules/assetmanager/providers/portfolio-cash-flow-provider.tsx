'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePortfolioCashFlowStore } from '../store/portfolio-cash-flow.store';
import { 
  type PortfolioCashFlow, 
  type PortfolioCashFlowWithRelations,
  type CreatePortfolioCashFlowInput,
  type UpdatePortfolioCashFlowInput
} from '../schemas/portfolio-cash-flow.schemas';

/**
 * Context type for the portfolio cash flow provider
 */
export interface PortfolioCashFlowContextType {
  // State
  cashFlows: PortfolioCashFlow[];
  cashFlowsWithRelations: PortfolioCashFlowWithRelations[];
  selectedCashFlow: PortfolioCashFlow | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCashFlows: () => Promise<void>;
  fetchCashFlowsWithRelations: () => Promise<void>;
  fetchCashFlow: (id: number) => Promise<void>;
  fetchCashFlowsByCompany: (companyId: number) => Promise<void>;
  fetchCashFlowsByFund: (fundId: number) => Promise<void>;
  fetchCashFlowsByRound: (roundId: number) => Promise<void>;
  setSelectedCashFlow: (cashFlow: PortfolioCashFlow | null) => void;
  clearError: () => void;
}

// Create the context
export const PortfolioCashFlowContext = createContext<PortfolioCashFlowContextType | null>(null);

/**
 * Provider component for portfolio cash flow-related state and actions
 */
export function PortfolioCashFlowProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    cashFlows,
    cashFlowsWithRelations,
    selectedCashFlow,
    isLoading,
    error,
    fetchCashFlows,
    fetchCashFlowsWithRelations,
    fetchCashFlow,
    fetchCashFlowsByCompany,
    fetchCashFlowsByFund,
    fetchCashFlowsByRound,
    setSelectedCashFlow,
    clearError
  } = usePortfolioCashFlowStore();
  
  // Fetch cash flows on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchCashFlows().catch(error => {
        if (isMounted) {
          console.error('Error fetching portfolio cash flows:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchCashFlows]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PortfolioCashFlowContextType>(() => ({
    cashFlows,
    cashFlowsWithRelations,
    selectedCashFlow,
    isLoading,
    error,
    fetchCashFlows,
    fetchCashFlowsWithRelations,
    fetchCashFlow,
    fetchCashFlowsByCompany,
    fetchCashFlowsByFund,
    fetchCashFlowsByRound,
    setSelectedCashFlow,
    clearError
  }), [
    cashFlows,
    cashFlowsWithRelations,
    selectedCashFlow,
    isLoading,
    error,
    fetchCashFlows,
    fetchCashFlowsWithRelations,
    fetchCashFlow,
    fetchCashFlowsByCompany,
    fetchCashFlowsByFund,
    fetchCashFlowsByRound,
    setSelectedCashFlow,
    clearError
  ]);
  
  return (
    <PortfolioCashFlowContext.Provider value={contextValue}>
      {children}
    </PortfolioCashFlowContext.Provider>
  );
}

/**
 * Hook to use the portfolio cash flow context
 * Throws an error if used outside of PortfolioCashFlowProvider
 */
export function usePortfolioCashFlowContext(): PortfolioCashFlowContextType {
  const context = useContext(PortfolioCashFlowContext);
  
  if (!context) {
    throw new Error('usePortfolioCashFlowContext must be used within a PortfolioCashFlowProvider');
  }
  
  return context;
}
