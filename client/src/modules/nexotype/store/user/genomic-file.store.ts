'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  GenomicFile,
  CreateGenomicFile,
  UpdateGenomicFile,
} from '@/modules/nexotype/schemas/user/genomic-file.schemas';
import {
  getGenomicFiles,
  getGenomicFile,
  createGenomicFile as apiCreateGenomicFile,
  updateGenomicFile as apiUpdateGenomicFile,
  deleteGenomicFile as apiDeleteGenomicFile,
  ListGenomicFilesParams,
} from '@/modules/nexotype/service/user/genomic-file.service';

/**
 * GenomicFile store state interface
 */
export interface GenomicFileState {
  // State
  genomicFiles: GenomicFile[];
  activeGenomicFileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchGenomicFiles: (params?: ListGenomicFilesParams) => Promise<boolean>;
  fetchGenomicFile: (id: number) => Promise<GenomicFile | null>;
  createGenomicFile: (data: CreateGenomicFile) => Promise<boolean>;
  updateGenomicFile: (id: number, data: UpdateGenomicFile) => Promise<boolean>;
  deleteGenomicFile: (id: number) => Promise<boolean>;
  setActiveGenomicFile: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create genomic file store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useGenomicFileStore = create<GenomicFileState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        genomicFiles: [],
        activeGenomicFileId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize genomic files state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicFiles();

            if (response.success && response.data) {
              set((state) => {
                state.genomicFiles = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize genomic files',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize genomic files',
            });
          }
        },

        /**
         * Fetch all genomic files with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchGenomicFiles: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicFiles(params);

            if (response.success && response.data) {
              set((state) => {
                state.genomicFiles = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch genomic files',
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
         * Fetch a specific genomic file by ID
         * @param id GenomicFile ID
         * @returns Promise with genomic file or null
         */
        fetchGenomicFile: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getGenomicFile(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch genomic file with ID ${id}`,
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
         * Create a new genomic file
         * @param data GenomicFile creation data
         * @returns Success status
         */
        createGenomicFile: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateGenomicFile(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchGenomicFiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create genomic file',
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
         * Update an existing genomic file
         * @param id GenomicFile ID
         * @param data GenomicFile update data
         * @returns Success status
         */
        updateGenomicFile: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateGenomicFile(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchGenomicFiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update genomic file with ID ${id}`,
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
         * Delete a genomic file
         * @param id GenomicFile ID
         * @returns Success status
         */
        deleteGenomicFile: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteGenomicFile(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchGenomicFiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete genomic file with ID ${id}`,
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
         * Set active genomic file
         * @param id ID of the active genomic file or null
         */
        setActiveGenomicFile: (id) => {
          set((state) => {
            state.activeGenomicFileId = id;
          });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset state to initial values
         */
        reset: () => {
          set({
            genomicFiles: [],
            activeGenomicFileId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-genomic-file-storage',
        partialize: (state) => ({
          activeGenomicFileId: state.activeGenomicFileId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get genomic file by ID from store
 * @param id GenomicFile ID
 * @returns The genomic file or undefined if not found
 */
export const getGenomicFileById = (id: number): GenomicFile | undefined => {
  const { genomicFiles } = useGenomicFileStore.getState();
  return genomicFiles.find((gf) => gf.id === id);
};

/**
 * Get active genomic file from store
 * @returns The active genomic file or undefined if not set
 */
export const getActiveGenomicFile = (): GenomicFile | undefined => {
  const { genomicFiles, activeGenomicFileId } = useGenomicFileStore.getState();
  return genomicFiles.find((gf) => gf.id === activeGenomicFileId);
};
