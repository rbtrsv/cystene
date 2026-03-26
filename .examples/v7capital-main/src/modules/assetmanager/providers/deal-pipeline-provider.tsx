'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useDealPipelineStore } from '../store/deal-pipeline.store';
import { type DealPipeline } from '../schemas/deal-pipeline.schemas';

/**
 * Context type for the deal pipeline provider
 */
export interface DealPipelineContextType {
  // State
  dealPipelines: DealPipeline[];
  selectedDealPipeline: DealPipeline | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDealPipelines: () => Promise<boolean>;
  fetchDealPipeline: (id: number) => Promise<boolean>;
  setSelectedDealPipeline: (dealPipeline: DealPipeline | null) => void;
  clearError: () => void;
}

// Create the context
export const DealPipelineContext = createContext<DealPipelineContextType | null>(null);

/**
 * Provider component for deal pipeline-related state and actions
 */
export function DealPipelineProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    dealPipelines,
    selectedDealPipeline,
    isLoading,
    error,
    fetchDealPipelines,
    fetchDealPipeline,
    setSelectedDealPipeline,
    clearError
  } = useDealPipelineStore();
  
  // Fetch deal pipelines on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchDealPipelines().catch(error => {
        if (isMounted) {
          console.error('Error fetching deal pipelines:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchDealPipelines]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DealPipelineContextType>(() => ({
    dealPipelines,
    selectedDealPipeline,
    isLoading,
    error,
    fetchDealPipelines,
    fetchDealPipeline,
    setSelectedDealPipeline,
    clearError
  }), [
    dealPipelines,
    selectedDealPipeline,
    isLoading,
    error,
    fetchDealPipelines,
    fetchDealPipeline,
    setSelectedDealPipeline,
    clearError
  ]);
  
  return (
    <DealPipelineContext.Provider value={contextValue}>
      {children}
    </DealPipelineContext.Provider>
  );
}

/**
 * Hook to use the deal pipeline context
 * @throws Error if used outside of a DealPipelineProvider
 */
export function useDealPipelineContext(): DealPipelineContextType {
  const context = useContext(DealPipelineContext);
  
  if (!context) {
    throw new Error('useDealPipelineContext must be used within a DealPipelineProvider');
  }
  
  return context;
}