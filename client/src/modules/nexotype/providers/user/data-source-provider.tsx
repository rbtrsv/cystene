'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDataSourceStore } from '@/modules/nexotype/store/user/data-source.store';
import { type DataSource } from '@/modules/nexotype/schemas/user/data-source.schemas';

/**
 * Context type for the data sources provider
 */
export interface DataSourceContextType {
  // State
  dataSources: DataSource[];
  activeDataSourceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDataSource: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DataSourceContext = createContext<DataSourceContextType | null>(null);

/**
 * Provider component for data source-related state and actions
 */
export function DataSourceProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    dataSources,
    activeDataSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDataSource,
    clearError,
  } = useDataSourceStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDataSourceStore.persist.rehydrate();
  }, []);

  // Initialize data sources on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing data sources:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DataSourceContextType>(() => ({
    dataSources,
    activeDataSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDataSource,
    clearError,
  }), [
    dataSources,
    activeDataSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDataSource,
    clearError,
  ]);

  return (
    <DataSourceContext.Provider value={contextValue}>
      {children}
    </DataSourceContext.Provider>
  );
}

/**
 * Default export
 */
export default DataSourceProvider;
