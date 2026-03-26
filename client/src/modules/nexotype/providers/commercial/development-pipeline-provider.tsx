'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDevelopmentPipelineStore } from '@/modules/nexotype/store/commercial/development-pipeline.store';
import { type DevelopmentPipeline } from '@/modules/nexotype/schemas/commercial/development-pipeline.schemas';

/**
 * Context type for the development pipelines provider
 */
export interface DevelopmentPipelineContextType {
  // State
  developmentPipelines: DevelopmentPipeline[];
  activeDevelopmentPipelineId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDevelopmentPipeline: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DevelopmentPipelineContext = createContext<DevelopmentPipelineContextType | null>(null);

/**
 * Provider component for development pipeline-related state and actions
 */
export function DevelopmentPipelineProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    developmentPipelines,
    activeDevelopmentPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDevelopmentPipeline,
    clearError,
  } = useDevelopmentPipelineStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDevelopmentPipelineStore.persist.rehydrate();
  }, []);

  // Initialize development pipelines on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing development pipelines:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DevelopmentPipelineContextType>(() => ({
    developmentPipelines,
    activeDevelopmentPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDevelopmentPipeline,
    clearError,
  }), [
    developmentPipelines,
    activeDevelopmentPipelineId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDevelopmentPipeline,
    clearError,
  ]);

  return (
    <DevelopmentPipelineContext.Provider value={contextValue}>
      {children}
    </DevelopmentPipelineContext.Provider>
  );
}

/**
 * Default export
 */
export default DevelopmentPipelineProvider;
