'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBiomarkerAssociationStore } from '@/modules/nexotype/store/knowledge_graph/biomarker-association.store';
import { type BiomarkerAssociation } from '@/modules/nexotype/schemas/knowledge_graph/biomarker-association.schemas';

/**
 * Context type for the biomarker associations provider
 */
export interface BiomarkerAssociationContextType {
  // State
  biomarkerAssociations: BiomarkerAssociation[];
  activeBiomarkerAssociationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBiomarkerAssociation: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BiomarkerAssociationContext = createContext<BiomarkerAssociationContextType | null>(null);

/**
 * Provider component for biomarker association-related state and actions
 */
export function BiomarkerAssociationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    biomarkerAssociations,
    activeBiomarkerAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarkerAssociation,
    clearError,
  } = useBiomarkerAssociationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBiomarkerAssociationStore.persist.rehydrate();
  }, []);

  // Initialize biomarker associations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing biomarker associations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BiomarkerAssociationContextType>(() => ({
    biomarkerAssociations,
    activeBiomarkerAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarkerAssociation,
    clearError,
  }), [
    biomarkerAssociations,
    activeBiomarkerAssociationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiomarkerAssociation,
    clearError,
  ]);

  return (
    <BiomarkerAssociationContext.Provider value={contextValue}>
      {children}
    </BiomarkerAssociationContext.Provider>
  );
}

/**
 * Default export
 */
export default BiomarkerAssociationProvider;
