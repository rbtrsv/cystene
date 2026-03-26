'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssayReadoutStore } from '@/modules/nexotype/store/lims/assay-readout.store';
import { type AssayReadout } from '@/modules/nexotype/schemas/lims/assay-readout.schemas';

/**
 * Context type for the assay readouts provider
 */
export interface AssayReadoutContextType {
  // State
  assayReadouts: AssayReadout[];
  activeAssayReadoutId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAssayReadout: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssayReadoutContext = createContext<AssayReadoutContextType | null>(null);

/**
 * Provider component for assay readout-related state and actions
 */
export function AssayReadoutProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assayReadouts,
    activeAssayReadoutId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayReadout,
    clearError,
  } = useAssayReadoutStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssayReadoutStore.persist.rehydrate();
  }, []);

  // Initialize assay readouts on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing assay readouts:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssayReadoutContextType>(() => ({
    assayReadouts,
    activeAssayReadoutId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayReadout,
    clearError,
  }), [
    assayReadouts,
    activeAssayReadoutId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayReadout,
    clearError,
  ]);

  return (
    <AssayReadoutContext.Provider value={contextValue}>
      {children}
    </AssayReadoutContext.Provider>
  );
}

/**
 * Default export
 */
export default AssayReadoutProvider;
