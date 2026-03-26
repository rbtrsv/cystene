'use client';

import { useContext } from 'react';
import { GenomicFileContext, GenomicFileContextType } from '@/modules/nexotype/providers/user/genomic-file-provider';
import { useGenomicFileStore } from '@/modules/nexotype/store/user/genomic-file.store';
import {
  type GenomicFile,
  type CreateGenomicFile,
  type UpdateGenomicFile,
} from '@/modules/nexotype/schemas/user/genomic-file.schemas';
import { ListGenomicFilesParams } from '@/modules/nexotype/service/user/genomic-file.service';

/**
 * Hook to use the genomic file context
 * @throws Error if used outside of a GenomicFileProvider
 */
export function useGenomicFileContext(): GenomicFileContextType {
  const context = useContext(GenomicFileContext);

  if (!context) {
    throw new Error('useGenomicFileContext must be used within a GenomicFileProvider');
  }

  return context;
}

/**
 * Custom hook that combines genomic file context and store
 * to provide a simplified interface for genomic file functionality
 *
 * @returns Genomic file utilities and state
 */
export function useGenomicFiles() {
  // Get data from genomic file context
  const {
    genomicFiles,
    activeGenomicFileId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveGenomicFile,
    clearError: clearContextError,
  } = useGenomicFileContext();

  // Get additional actions from genomic file store
  const {
    fetchGenomicFiles,
    fetchGenomicFile,
    createGenomicFile,
    updateGenomicFile,
    deleteGenomicFile,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useGenomicFileStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active genomic file
  const activeGenomicFile = genomicFiles.find((item: GenomicFile) => item.id === activeGenomicFileId) || null;

  return {
    // State
    genomicFiles,
    activeGenomicFileId,
    activeGenomicFile,
    isLoading,
    error,
    isInitialized,

    // GenomicFile actions
    fetchGenomicFiles,
    fetchGenomicFile,
    createGenomicFile,
    updateGenomicFile,
    deleteGenomicFile,
    setActiveGenomicFile,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return genomicFiles.find((item: GenomicFile) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListGenomicFilesParams) => {
      return await fetchGenomicFiles(filters);
    },
    createWithData: async (data: CreateGenomicFile) => {
      return await createGenomicFile(data);
    },
    updateWithData: async (id: number, data: UpdateGenomicFile) => {
      return await updateGenomicFile(id, data);
    },
  };
}

export default useGenomicFiles;
