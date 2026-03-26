'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useInvestmentPortfolioStore } from '../store/portfolio-investment.store';
import { 
  type InvestmentPortfolio, 
  type InvestmentPortfolioWithRelations,
  type CreateInvestmentPortfolioInput,
  type UpdateInvestmentPortfolioInput
} from '../schemas/portfolio-investment.schemas';

/**
 * Context type for the investment portfolio provider
 */
export interface InvestmentPortfolioContextType {
  // State
  portfolios: InvestmentPortfolio[];
  portfoliosWithRelations: InvestmentPortfolioWithRelations[];
  selectedPortfolio: InvestmentPortfolio | null;
  totalFundUnits: number | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPortfolios: () => Promise<void>;
  fetchPortfoliosWithRelations: () => Promise<void>;
  fetchPortfolio: (id: number) => Promise<void>;
  addPortfolio: (data: CreateInvestmentPortfolioInput) => Promise<boolean>;
  editPortfolio: (id: number, data: UpdateInvestmentPortfolioInput) => Promise<boolean>;
  removePortfolio: (id: number) => Promise<boolean>;
  fetchPortfoliosByCompany: (companyId: number) => Promise<void>;
  fetchPortfoliosByFund: (fundId: number) => Promise<void>;
  fetchFundUnits: (fundId?: number) => Promise<void>;
  setSelectedPortfolio: (portfolio: InvestmentPortfolio | null) => void;
  clearError: () => void;
}

// Create the context
export const InvestmentPortfolioContext = createContext<InvestmentPortfolioContextType | null>(null);

/**
 * Provider component for investment portfolio-related state and actions
 */
export function InvestmentPortfolioProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    portfolios,
    portfoliosWithRelations,
    selectedPortfolio,
    totalFundUnits,
    isLoading,
    error,
    fetchPortfolios,
    fetchPortfoliosWithRelations,
    fetchPortfolio,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    fetchPortfoliosByCompany,
    fetchPortfoliosByFund,
    fetchFundUnits,
    setSelectedPortfolio,
    clearError
  } = useInvestmentPortfolioStore();
  
  // Fetch portfolios on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchPortfolios().catch(error => {
        if (isMounted) {
          console.error('Error fetching investment portfolios:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchPortfolios]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<InvestmentPortfolioContextType>(() => ({
    portfolios,
    portfoliosWithRelations,
    selectedPortfolio,
    totalFundUnits,
    isLoading,
    error,
    fetchPortfolios,
    fetchPortfoliosWithRelations,
    fetchPortfolio,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    fetchPortfoliosByCompany,
    fetchPortfoliosByFund,
    fetchFundUnits,
    setSelectedPortfolio,
    clearError
  }), [
    portfolios,
    portfoliosWithRelations,
    selectedPortfolio,
    totalFundUnits,
    isLoading,
    error,
    fetchPortfolios,
    fetchPortfoliosWithRelations,
    fetchPortfolio,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    fetchPortfoliosByCompany,
    fetchPortfoliosByFund,
    fetchFundUnits,
    setSelectedPortfolio,
    clearError
  ]);
  
  return (
    <InvestmentPortfolioContext.Provider value={contextValue}>
      {children}
    </InvestmentPortfolioContext.Provider>
  );
}

/**
 * Hook to use the investment portfolio context
 * @throws Error if used outside of an InvestmentPortfolioProvider
 */
export function useInvestmentPortfolioContext(): InvestmentPortfolioContextType {
  const context = useContext(InvestmentPortfolioContext);
  
  if (!context) {
    throw new Error('useInvestmentPortfolioContext must be used within an InvestmentPortfolioProvider');
  }
  
  return context;
}
