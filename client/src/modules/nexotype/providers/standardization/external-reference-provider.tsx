'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useExternalReferenceStore } from '@/modules/nexotype/store/standardization/external-reference.store';
import { type ExternalReference } from '@/modules/nexotype/schemas/standardization/external-reference.schemas';

/**
 * Context type for the external references provider
 */
export interface ExternalReferenceContextType {
  // State
  externalReferences: ExternalReference[];
  activeExternalReferenceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveExternalReference: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ExternalReferenceContext = createContext<ExternalReferenceContextType | null>(null);

/**
 * Provider component for external reference-related state and actions
 */
export function ExternalReferenceProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    externalReferences,
    activeExternalReferenceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExternalReference,
    clearError,
  } = useExternalReferenceStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useExternalReferenceStore.persist.rehydrate();
  }, []);

  // Initialize external references on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing external references:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ExternalReferenceContextType>(() => ({
    externalReferences,
    activeExternalReferenceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExternalReference,
    clearError,
  }), [
    externalReferences,
    activeExternalReferenceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveExternalReference,
    clearError,
  ]);

  return (
    <ExternalReferenceContext.Provider value={contextValue}>
      {children}
    </ExternalReferenceContext.Provider>
  );
}

/**
 * Default export
 */
export default ExternalReferenceProvider;
