'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssayProtocolStore } from '@/modules/nexotype/store/lims/assay-protocol.store';
import { type AssayProtocol } from '@/modules/nexotype/schemas/lims/assay-protocol.schemas';

/**
 * Context type for the assay protocols provider
 */
export interface AssayProtocolContextType {
  // State
  assayProtocols: AssayProtocol[];
  activeAssayProtocolId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAssayProtocol: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssayProtocolContext = createContext<AssayProtocolContextType | null>(null);

/**
 * Provider component for assay protocol-related state and actions
 */
export function AssayProtocolProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assayProtocols,
    activeAssayProtocolId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayProtocol,
    clearError,
  } = useAssayProtocolStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssayProtocolStore.persist.rehydrate();
  }, []);

  // Initialize assay protocols on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing assay protocols:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssayProtocolContextType>(() => ({
    assayProtocols,
    activeAssayProtocolId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayProtocol,
    clearError,
  }), [
    assayProtocols,
    activeAssayProtocolId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssayProtocol,
    clearError,
  ]);

  return (
    <AssayProtocolContext.Provider value={contextValue}>
      {children}
    </AssayProtocolContext.Provider>
  );
}

/**
 * Default export
 */
export default AssayProtocolProvider;
