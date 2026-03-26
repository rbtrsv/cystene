'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DataSource,
  CreateDataSource,
  UpdateDataSource,
} from '@/modules/nexotype/schemas/user/data-source.schemas';
import {
  getDataSources,
  getDataSource,
  createDataSource as apiCreateDataSource,
  updateDataSource as apiUpdateDataSource,
  deleteDataSource as apiDeleteDataSource,
  ListDataSourcesParams,
} from '@/modules/nexotype/service/user/data-source.service';

// Zustand state + action contract for this entity.
export interface DataSourceState {
  // State
  dataSources: DataSource[];
  activeDataSourceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDataSources: (params?: ListDataSourcesParams) => Promise<boolean>;
  fetchDataSource: (id: number) => Promise<DataSource | null>;
  createDataSource: (data: CreateDataSource) => Promise<boolean>;
  updateDataSource: (id: number, data: UpdateDataSource) => Promise<boolean>;
  deleteDataSource: (id: number) => Promise<boolean>;
  setActiveDataSource: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Zustand store for data source CRUD flows.
// Mirrors the established domain pattern: initialize, fetch, create, update, soft-delete.
// Store implementation used by provider + hook layers.
export const useDataSourceStore = create<DataSourceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        dataSources: [],
        activeDataSourceId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize data sources state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await getDataSources();
            if (response.success && response.data) {
              set((state) => {
                state.dataSources = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize data sources',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize data sources',
            });
          }
        },

        /**
         * Fetch all data sources with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchDataSources: async (params) => {
          set({ isLoading: true, error: null });
          try {
            const response = await getDataSources(params);
            if (response.success && response.data) {
              set((state) => {
                state.dataSources = response.data || [];
                state.isLoading = false;
              });
              return true;
            }
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch data sources',
            });
            return false;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return false;
          }
        },

        /**
         * Fetch a specific data source by ID
         * @param id DataSource ID
         * @returns Promise with data source or null
         */
        fetchDataSource: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const response = await getDataSource(id);
            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }
            set({
              isLoading: false,
              error: response.error || `Failed to fetch data source with ID ${id}`,
            });
            return null;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred',
            });
            return null;
          }
        },

        /**
         * Create a new data source
         * @param data DataSource creation data
         * @returns Success status
         */
        createDataSource: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiCreateDataSource(data);
            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchDataSources();
              set({ isLoading: false });
              return true;
            }
            set({ isLoading: false, error: response.error || 'Failed to create data source' });
            return false;
          } catch (error) {
            set({ isLoading: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' });
            return false;
          }
        },

        /**
         * Update an existing data source
         * @param id DataSource ID
         * @param data DataSource update data
         * @returns Success status
         */
        updateDataSource: async (id, data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiUpdateDataSource(id, data);
            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchDataSources();
              set({ isLoading: false });
              return true;
            }
            set({ isLoading: false, error: response.error || `Failed to update data source with ID ${id}` });
            return false;
          } catch (error) {
            set({ isLoading: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' });
            return false;
          }
        },

        /**
         * Delete a data source
         * @param id DataSource ID
         * @returns Success status
         */
        deleteDataSource: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiDeleteDataSource(id);
            if (response.success) {
              // After deleting, refresh list
              await get().fetchDataSources();
              set({ isLoading: false });
              return true;
            }
            set({ isLoading: false, error: response.error || `Failed to delete data source with ID ${id}` });
            return false;
          } catch (error) {
            set({ isLoading: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' });
            return false;
          }
        },

        /**
         * Set active data source
         * @param id ID of the active data source or null
         */
        setActiveDataSource: (id) =>
          set((state) => {
            state.activeDataSourceId = id;
          }),

        /**
         * Clear error message
         */
        clearError: () => set({ error: null }),

        /**
         * Reset state to initial values
         */
        reset: () =>
          set({
            dataSources: [],
            activeDataSourceId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          }),
      })),
      {
        name: 'nexotype-data-source-storage',
        partialize: (state) => ({
          activeDataSourceId: state.activeDataSourceId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get data source by ID from store
 * @param id DataSource ID
 * @returns The data source or undefined if not found
 */
export const getDataSourceById = (id: number): DataSource | undefined => {
  const { dataSources } = useDataSourceStore.getState();
  return dataSources.find((ds) => ds.id === id);
};

/**
 * Get active data source from store
 * @returns The active data source or undefined if not set
 */
export const getActiveDataSource = (): DataSource | undefined => {
  const { dataSources, activeDataSourceId } = useDataSourceStore.getState();
  return dataSources.find((ds) => ds.id === activeDataSourceId);
};
