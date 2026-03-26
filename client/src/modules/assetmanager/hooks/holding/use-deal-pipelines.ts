'use client';

import { useContext } from 'react';
import { DealPipelineContext, DealPipelineContextType } from '../../providers/holding/deal-pipeline-provider';
import { useDealPipelineStore } from '../../store/holding/deal-pipeline.store';
import {
  type DealPipeline,
  type CreateDealPipeline,
  type UpdateDealPipeline,
} from '../../schemas/holding/deal-pipeline.schemas';
import { ListDealPipelinesParams } from '../../service/holding/deal-pipeline.service';

/**
 * Hook to use the deal pipelines context
 * @throws Error if used outside of the provider
 */
export function useDealPipelineContext(): DealPipelineContextType {
  const context = useContext(DealPipelineContext);

  if (!context) {
    throw new Error('useDealPipelineContext must be used within a DealPipelineProvider');
  }

  return context;
}

/**
 * Custom hook that combines deal pipelines context and store
 * to provide a simplified interface for deal pipelines functionality
 *
 * @returns Deal Pipelines utilities and state
 */
export function useDealPipelines() {
  // Get data from deal pipeline context
  const {
    dealPipelines,
    activeDealPipelineId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDealPipeline,
    clearError: clearContextError,
  } = useDealPipelineContext();

  // Get additional actions from deal pipeline store
  const {
    fetchDealPipelines,
    fetchDealPipeline,
    createDealPipeline,
    updateDealPipeline,
    deleteDealPipeline,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDealPipelineStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active deal pipeline
  const activeDealPipeline = dealPipelines.find((item: DealPipeline) => item.id === activeDealPipelineId) || null;

  return {
    // State
    dealPipelines,
    activeDealPipelineId,
    activeDealPipeline,
    isLoading,
    error,
    isInitialized,

    // Deal pipeline actions
    fetchDealPipelines,
    fetchDealPipeline,
    createDealPipeline,
    updateDealPipeline,
    deleteDealPipeline,
    setActiveDealPipeline,
    initialize,
    clearError,

    // Helper methods
    getDealPipelineById: (id: number) => {
      return dealPipelines.find((item: DealPipeline) => item.id === id);
    },
    getDealPipelinesByEntity: (entityId: number) => {
      return dealPipelines.filter((item: DealPipeline) => item.entity_id === entityId);
    },
    getDealPipelinesByStatus: (status: string) => {
      return dealPipelines.filter((item: DealPipeline) => item.status === status);
    },

    // Convenience wrapper functions
    fetchDealPipelinesWithFilters: async (filters: ListDealPipelinesParams) => {
      return await fetchDealPipelines(filters);
    },
    createDealPipelineWithData: async (data: CreateDealPipeline) => {
      return await createDealPipeline(data);
    },
    updateDealPipelineWithData: async (id: number, data: UpdateDealPipeline) => {
      return await updateDealPipeline(id, data);
    },
  };
}

export default useDealPipelines;
