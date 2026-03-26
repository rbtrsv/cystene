'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Source,
  CreateSource,
  UpdateSource,
} from '@/modules/nexotype/schemas/knowledge_graph/source.schemas';
import {
  getSources,
  getSource,
  createSource as apiCreateSource,
  updateSource as apiUpdateSource,
  deleteSource as apiDeleteSource,
  ListSourcesParams,
} from '@/modules/nexotype/service/knowledge_graph/source.service';

// Zustand state + action contract for this entity.
export interface SourceState {
  // State
  sources: Source[];
  activeSourceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchSources: (params?: ListSourcesParams) => Promise<boolean>;
  fetchSource: (id: number) => Promise<Source | null>;
  createSource: (data: CreateSource) => Promise<boolean>;
  updateSource: (id: number, data: UpdateSource) => Promise<boolean>;
  deleteSource: (id: number) => Promise<boolean>;
  setActiveSource: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Store implementation used by provider + hook layers.
export const useSourceStore = create<SourceState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      sources: [],
      activeSourceId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Bootstrap initial list state for first-load screens.
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await getSources();
          if (response.success && response.data) {
            set((state) => {
              state.sources = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize sources',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize sources',
          });
        }
      },

      // Load list data with optional filters.
      fetchSources: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getSources(params);
          if (response.success && response.data) {
            set((state) => {
              state.sources = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch sources',
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

      // Load one record for details pages and deep-links.
      fetchSource: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await getSource(id);
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch source with ID ${id}`,
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

      // Create and refresh list so UI remains consistent.
      createSource: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCreateSource(data);
          if (response.success && response.data) {
            await get().fetchSources();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create source',
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

      // Update and refresh list so UI remains consistent.
      updateSource: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiUpdateSource(id, data);
          if (response.success && response.data) {
            await get().fetchSources();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update source with ID ${id}`,
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

      // Soft-delete and refresh list so archived rows are hidden.
      deleteSource: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiDeleteSource(id);
          if (response.success) {
            await get().fetchSources();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete source with ID ${id}`,
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

      setActiveSource: (id) => {
        set((state) => {
          state.activeSourceId = id;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          sources: [],
          activeSourceId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-source-storage',
        partialize: (state) => ({
          activeSourceId: state.activeSourceId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get source by ID from store
 * @param id Source ID
 * @returns The source or undefined if not found
 */
export const getSourceById = (id: number): Source | undefined => {
  const { sources } = useSourceStore.getState();
  return sources.find((source) => source.id === id);
};

/**
 * Get active source from store
 * @returns The active source or undefined if not set
 */
export const getActiveSource = (): Source | undefined => {
  const { sources, activeSourceId } = useSourceStore.getState();
  return sources.find((source) => source.id === activeSourceId);
};
