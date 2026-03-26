'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useFeeCostsStore } from '../store/fee-costs.store';
import { type FeeCost } from '../schemas/fee-costs.schemas';

/**
 * Context type for the fee costs provider
 */
export interface FeeCostsContextType {
  // State
  feeCosts: FeeCost[];
  selectedFeeCost: FeeCost | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFeeCosts: () => Promise<boolean>;
  fetchFeeCost: (id: number) => Promise<boolean>;
  setSelectedFeeCost: (feeCost: FeeCost | null) => void;
  clearError: () => void;
}

// Create the context
export const FeeCostsContext = createContext<FeeCostsContextType | null>(null);

/**
 * Provider component for fee costs-related state and actions
 */
export function FeeCostsProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    feeCosts,
    selectedFeeCost,
    isLoading,
    error,
    fetchFeeCosts,
    fetchFeeCost,
    setSelectedFeeCost,
    clearError
  } = useFeeCostsStore();
  
  // Fetch fee costs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchFeeCosts().catch(error => {
        if (isMounted) {
          console.error('Error fetching fee costs:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchFeeCosts]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FeeCostsContextType>(() => ({
    feeCosts,
    selectedFeeCost,
    isLoading,
    error,
    fetchFeeCosts,
    fetchFeeCost,
    setSelectedFeeCost,
    clearError
  }), [
    feeCosts,
    selectedFeeCost,
    isLoading,
    error,
    fetchFeeCosts,
    fetchFeeCost,
    setSelectedFeeCost,
    clearError
  ]);
  
  return (
    <FeeCostsContext.Provider value={contextValue}>
      {children}
    </FeeCostsContext.Provider>
  );
}

/**
 * Hook to use the fee costs context
 * @throws Error if used outside of a FeeCostsProvider
 */
export function useFeeCostsContext(): FeeCostsContextType {
  const context = useContext(FeeCostsContext);
  
  if (!context) {
    throw new Error('useFeeCostsContext must be used within a FeeCostsProvider');
  }
  
  return context;
}