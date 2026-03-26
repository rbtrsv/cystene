'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useGenomicFileStore } from '@/modules/nexotype/store/user/genomic-file.store';
import { type GenomicFile } from '@/modules/nexotype/schemas/user/genomic-file.schemas';

/**
 * Context type for the genomic files provider
 */
export interface GenomicFileContextType {
  // State
  genomicFiles: GenomicFile[];
  activeGenomicFileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveGenomicFile: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const GenomicFileContext = createContext<GenomicFileContextType | null>(null);

/**
 * Provider component for genomic file-related state and actions
 */
export function GenomicFileProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    genomicFiles,
    activeGenomicFileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicFile,
    clearError,
  } = useGenomicFileStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useGenomicFileStore.persist.rehydrate();
  }, []);

  // Initialize genomic files on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing genomic files:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GenomicFileContextType>(() => ({
    genomicFiles,
    activeGenomicFileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicFile,
    clearError,
  }), [
    genomicFiles,
    activeGenomicFileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicFile,
    clearError,
  ]);

  return (
    <GenomicFileContext.Provider value={contextValue}>
      {children}
    </GenomicFileContext.Provider>
  );
}

/**
 * Default export
 */
export default GenomicFileProvider;
