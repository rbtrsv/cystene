'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePortfolioPerformanceStore } from '../store/portfolio-performance.store';
import { type PortfolioPerformance } from '../schemas/portfolio-performance.schemas';

/**
 * Context type for the portfolio performance provider
 */
export interface PortfolioPerformanceContextType {
  // State
  portfolioPerformances: PortfolioPerformance[];
  selectedPortfolioPerformance: PortfolioPerformance | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPortfolioPerformances: () => Promise<boolean>;
  fetchPortfolioPerformance: (id: number) => Promise<boolean>;
  setSelectedPortfolioPerformance: (portfolioPerformance: PortfolioPerformance | null) => void;
  clearError: () => void;
}

// Create the context
export const PortfolioPerformanceContext = createContext<PortfolioPerformanceContextType | null>(null);

/**
 * Provider component for portfolio performance-related state and actions
 */
export function PortfolioPerformanceProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    portfolioPerformances,
    selectedPortfolioPerformance,
    isLoading,
    error,
    fetchPortfolioPerformances,
    fetchPortfolioPerformance,
    setSelectedPortfolioPerformance,
    clearError
  } = usePortfolioPerformanceStore();
  
  // Fetch portfolio performances on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchPortfolioPerformances().catch(error => {
        if (isMounted) {
          console.error('Error fetching portfolio performances:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchPortfolioPerformances]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PortfolioPerformanceContextType>(() => ({
    portfolioPerformances,
    selectedPortfolioPerformance,
    isLoading,
    error,
    fetchPortfolioPerformances,
    fetchPortfolioPerformance,
    setSelectedPortfolioPerformance,
    clearError
  }), [
    portfolioPerformances,
    selectedPortfolioPerformance,
    isLoading,
    error,
    fetchPortfolioPerformances,
    fetchPortfolioPerformance,
    setSelectedPortfolioPerformance,
    clearError
  ]);
  
  return (
    <PortfolioPerformanceContext.Provider value={contextValue}>
      {children}
    </PortfolioPerformanceContext.Provider>
  );
}

/**
 * Hook to use the portfolio performance context
 * @throws Error if used outside of a PortfolioPerformanceProvider
 */
export function usePortfolioPerformanceContext(): PortfolioPerformanceContextType {
  const context = useContext(PortfolioPerformanceContext);
  
  if (!context) {
    throw new Error('usePortfolioPerformanceContext must be used within a PortfolioPerformanceProvider');
  }
  
  return context;
}