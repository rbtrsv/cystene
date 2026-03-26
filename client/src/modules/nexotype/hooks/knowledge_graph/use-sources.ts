'use client';

import { useContext } from 'react';
import { SourceContext, SourceContextType } from '@/modules/nexotype/providers/knowledge_graph/source-provider';
import { useSourceStore } from '@/modules/nexotype/store/knowledge_graph/source.store';
import {
  type Source,
  type CreateSource,
  type UpdateSource,
} from '@/modules/nexotype/schemas/knowledge_graph/source.schemas';
import { ListSourcesParams } from '@/modules/nexotype/service/knowledge_graph/source.service';

/**
 * Hook to use the source context
 * @throws Error if used outside of a SourceProvider
 */
export function useSourceContext(): SourceContextType {
  const context = useContext(SourceContext);
  if (!context) {
    throw new Error('useSourceContext must be used within a SourceProvider');
  }
  return context;
}

/**
 * Custom hook that combines source context and store
 * to provide a simplified interface for source functionality.
 *
 * @returns Source utilities and state
 */
export function useSources() {
  // Get data from source context
  const {
    sources,
    activeSourceId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveSource,
    clearError: clearContextError,
  } = useSourceContext();

  // Get additional actions from source store
  const {
    fetchSources,
    fetchSource,
    createSource,
    updateSource,
    deleteSource,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useSourceStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active source
  const activeSource = sources.find(
    (source: Source) => source.id === activeSourceId
  ) || null;

  return {
    // State
    sources,
    activeSourceId,
    activeSource,
    isLoading,
    error,
    isInitialized,
    fetchSources,
    fetchSource,
    createSource,
    updateSource,
    deleteSource,
    setActiveSource,
    initialize,
    clearError,
    // Helper methods
    getById: (id: number) => {
      return sources.find((source: Source) => source.id === id);
    },
    // entity-specific helpers — find source by external identifier
    getByExternalId: (externalId: string) => {
      return sources.find((source: Source) => source.external_id === externalId);
    },
    fetchWithFilters: async (filters: ListSourcesParams) => {
      return await fetchSources(filters);
    },
    createWithData: async (data: CreateSource) => {
      return await createSource(data);
    },
    updateWithData: async (id: number, data: UpdateSource) => {
      return await updateSource(id, data);
    },
  };
}

export default useSources;
