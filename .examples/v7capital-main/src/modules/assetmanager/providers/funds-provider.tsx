'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useFundsStore } from '../store/funds.store';
import { type Fund, type FundWithStakeholders, type FundWithRounds } from '../schemas/funds.schemas';

/**
 * Context type for the funds provider
 */
export interface FundsContextType {
  // State
  funds: Fund[];
  selectedFund: Fund | FundWithStakeholders | FundWithRounds | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFunds: () => Promise<void>;
  fetchFund: (id: number) => Promise<void>;
  fetchFundWithStakeholders: (id: number) => Promise<void>;
  fetchFundWithRounds: (id: number) => Promise<void>;
  setSelectedFund: (fund: Fund | FundWithStakeholders | FundWithRounds | null) => void;
  clearError: () => void;
}

// Create the context
export const FundsContext = createContext<FundsContextType | null>(null);

/**
 * Provider component for funds-related state and actions
 */
export function FundsProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    funds,
    selectedFund,
    isLoading,
    error,
    fetchFunds,
    fetchFund,
    fetchFundWithStakeholders,
    fetchFundWithRounds,
    setSelectedFund,
    clearError
  } = useFundsStore();
  
  // Fetch funds on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchFunds().catch(error => {
        if (isMounted) {
          console.error('Error fetching funds:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchFunds]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FundsContextType>(() => ({
    funds,
    selectedFund,
    isLoading,
    error,
    fetchFunds,
    fetchFund,
    fetchFundWithStakeholders,
    fetchFundWithRounds,
    setSelectedFund,
    clearError
  }), [
    funds,
    selectedFund,
    isLoading,
    error,
    fetchFunds,
    fetchFund,
    fetchFundWithStakeholders,
    fetchFundWithRounds,
    setSelectedFund,
    clearError
  ]);
  
  return (
    <FundsContext.Provider value={contextValue}>
      {children}
    </FundsContext.Provider>
  );
}

/**
 * Hook to use the funds context
 * @throws Error if used outside of a FundsProvider
 */
export function useFundsContext(): FundsContextType {
  const context = useContext(FundsContext);
  
  if (!context) {
    throw new Error('useFundsContext must be used within a FundsProvider');
  }
  
  return context;
}
