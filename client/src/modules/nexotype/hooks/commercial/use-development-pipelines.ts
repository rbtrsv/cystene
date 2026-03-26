'use client';

import { useContext } from 'react';
import { DevelopmentPipelineContext, DevelopmentPipelineContextType } from '@/modules/nexotype/providers/commercial/development-pipeline-provider';
import { useDevelopmentPipelineStore } from '@/modules/nexotype/store/commercial/development-pipeline.store';
import {
  type DevelopmentPipeline,
  type CreateDevelopmentPipeline,
  type UpdateDevelopmentPipeline,
} from '@/modules/nexotype/schemas/commercial/development-pipeline.schemas';
import { ListDevelopmentPipelinesParams } from '@/modules/nexotype/service/commercial/development-pipeline.service';

/**
 * Hook to use the development pipeline context
 * @throws Error if used outside of a DevelopmentPipelineProvider
 */
export function useDevelopmentPipelineContext(): DevelopmentPipelineContextType {
  const context = useContext(DevelopmentPipelineContext);

  if (!context) {
    throw new Error('useDevelopmentPipelineContext must be used within a DevelopmentPipelineProvider');
  }

  return context;
}

/**
 * Custom hook that combines development pipeline context and store
 * to provide a simplified interface for development pipeline functionality
 *
 * @returns Development pipeline utilities and state
 */
export function useDevelopmentPipelines() {
  // Get data from development pipeline context
  const {
    developmentPipelines,
    activeDevelopmentPipelineId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDevelopmentPipeline,
    clearError: clearContextError,
  } = useDevelopmentPipelineContext();

  // Get additional actions from development pipeline store
  const {
    fetchDevelopmentPipelines,
    fetchDevelopmentPipeline,
    createDevelopmentPipeline,
    updateDevelopmentPipeline,
    deleteDevelopmentPipeline,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDevelopmentPipelineStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active development pipeline
  const activeDevelopmentPipeline = developmentPipelines.find((item: DevelopmentPipeline) => item.id === activeDevelopmentPipelineId) || null;

  return {
    // State
    developmentPipelines,
    activeDevelopmentPipelineId,
    activeDevelopmentPipeline,
    isLoading,
    error,
    isInitialized,

    // DevelopmentPipeline actions
    fetchDevelopmentPipelines,
    fetchDevelopmentPipeline,
    createDevelopmentPipeline,
    updateDevelopmentPipeline,
    deleteDevelopmentPipeline,
    setActiveDevelopmentPipeline,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return developmentPipelines.find((item: DevelopmentPipeline) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListDevelopmentPipelinesParams) => {
      return await fetchDevelopmentPipelines(filters);
    },
    createWithData: async (data: CreateDevelopmentPipeline) => {
      return await createDevelopmentPipeline(data);
    },
    updateWithData: async (id: number, data: UpdateDevelopmentPipeline) => {
      return await updateDevelopmentPipeline(id, data);
    },
  };
}

export default useDevelopmentPipelines;
