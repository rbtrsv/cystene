'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDealPipelineStore } from '../../store/holding/deal-pipeline.store';
import { type DealPipeline } from '../../schemas/holding/deal-pipeline.schemas';

/**
 * Context type for the deal pipeline provider
 */
export interface DealPipelineContextType {
  // State
  dealPipelines: DealPipeline[];
  activeDealPipelineId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDealPipeline: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DealPipelineContext = createContext<DealPipelineContextType | null>(null);

/**
 * Provider component for deal pipeline-related state and actions
 */
export function DealPipelineProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    dealPipelines,
    activeDealPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealPipeline,
    clearError,
  } = useDealPipelineStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDealPipelineStore.persist.rehydrate();
  }, []);

  // Initialize deal pipelines on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing deal pipelines:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DealPipelineContextType>(() => ({
    dealPipelines,
    activeDealPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealPipeline,
    clearError,
  }), [
    dealPipelines,
    activeDealPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDealPipeline,
    clearError,
  ]);

  return (
    <DealPipelineContext.Provider value={contextValue}>
      {children}
    </DealPipelineContext.Provider>
  );
}

/**
 * Default export
 */
export default DealPipelineProvider;
