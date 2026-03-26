'use client';

import { useContext } from 'react';
import {
  DataSourceContext,
  DataSourceContextType,
} from '@/modules/nexotype/providers/user/data-source-provider';
import { useDataSourceStore } from '@/modules/nexotype/store/user/data-source.store';
import {
  type DataSource,
  type CreateDataSource,
  type UpdateDataSource,
} from '@/modules/nexotype/schemas/user/data-source.schemas';
import { ListDataSourcesParams } from '@/modules/nexotype/service/user/data-source.service';

/**
 * Hook to use the data source context
 * @throws Error if used outside of a DataSourceProvider
 */
export function useDataSourceContext(): DataSourceContextType {
  const context = useContext(DataSourceContext);

  if (!context) {
    throw new Error('useDataSourceContext must be used within a DataSourceProvider');
  }

  return context;
}

/**
 * Custom hook that combines data source context and store
 * to provide a simplified interface for data source functionality
 *
 * @returns Data source utilities and state
 */
export function useDataSources() {
  // Get data from data source context
  const {
    dataSources,
    activeDataSourceId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveDataSource,
    clearError: clearContextError,
  } = useDataSourceContext();

  // Get additional actions from data source store
  const {
    fetchDataSources,
    fetchDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useDataSourceStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active data source
  const activeDataSource = dataSources.find((item: DataSource) => item.id === activeDataSourceId) || null;

  return {
    // State
    dataSources,
    activeDataSourceId,
    activeDataSource,
    isLoading,
    error,
    isInitialized,

    // DataSource actions
    fetchDataSources,
    fetchDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    setActiveDataSource,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return dataSources.find((item: DataSource) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListDataSourcesParams) => {
      return await fetchDataSources(filters);
    },
    createWithData: async (data: CreateDataSource) => {
      return await createDataSource(data);
    },
    updateWithData: async (id: number, data: UpdateDataSource) => {
      return await updateDataSource(id, data);
    },
  };
}

export default useDataSources;
