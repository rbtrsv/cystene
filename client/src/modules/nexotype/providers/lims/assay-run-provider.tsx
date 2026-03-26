'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssayRunStore } from '@/modules/nexotype/store/lims/assay-run.store';
import { type AssayRun } from '@/modules/nexotype/schemas/lims/assay-run.schemas';

/**
 * Context type for the assay runs provider
 */
export interface AssayRunContextType {
  // State
  assayRuns: AssayRun[];
  activeAssayRunId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAssayRun: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssayRunContext = createContext<AssayRunContextType | null>(null);

/**
 * Provider component for assay run-related state and actions
 */
export function AssayRunProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assayRuns,
    activeAssayRunId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayRun,
    clearError,
  } = useAssayRunStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssayRunStore.persist.rehydrate();
  }, []);

  // Initialize assay runs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing assay runs:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssayRunContextType>(() => ({
    assayRuns,
    activeAssayRunId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayRun,
    clearError,
  }), [
    assayRuns,
    activeAssayRunId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayRun,
    clearError,
  ]);

  return (
    <AssayRunContext.Provider value={contextValue}>
      {children}
    </AssayRunContext.Provider>
  );
}

/**
 * Default export
 */
export default AssayRunProvider;
