'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useGenomicAssociationStore } from '@/modules/nexotype/store/knowledge_graph/genomic-association.store';
import { type GenomicAssociation } from '@/modules/nexotype/schemas/knowledge_graph/genomic-association.schemas';

/**
 * Context type for the genomic associations provider
 */
export interface GenomicAssociationContextType {
  // State
  genomicAssociations: GenomicAssociation[];
  activeGenomicAssociationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveGenomicAssociation: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const GenomicAssociationContext = createContext<GenomicAssociationContextType | null>(null);

/**
 * Provider component for genomic association-related state and actions
 */
export function GenomicAssociationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    genomicAssociations,
    activeGenomicAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicAssociation,
    clearError,
  } = useGenomicAssociationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useGenomicAssociationStore.persist.rehydrate();
  }, []);

  // Initialize genomic associations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing genomic associations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GenomicAssociationContextType>(() => ({
    genomicAssociations,
    activeGenomicAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicAssociation,
    clearError,
  }), [
    genomicAssociations,
    activeGenomicAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveGenomicAssociation,
    clearError,
  ]);

  return (
    <GenomicAssociationContext.Provider value={contextValue}>
      {children}
    </GenomicAssociationContext.Provider>
  );
}

/**
 * Default export
 */
export default GenomicAssociationProvider;
