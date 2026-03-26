'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSourceStore } from '@/modules/nexotype/store/knowledge_graph/source.store';
import { type Source } from '@/modules/nexotype/schemas/knowledge_graph/source.schemas';

/**
 * Context type for the sources provider
 */
export interface SourceContextType {
  // State
  sources: Source[];
  activeSourceId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveSource: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SourceContext = createContext<SourceContextType | null>(null);

/**
 * Provider component for source-related state and actions
 */
export function SourceProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    sources,
    activeSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSource,
    clearError,
  } = useSourceStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSourceStore.persist.rehydrate();
  }, []);

  // Initialize sources on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing sources:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SourceContextType>(() => ({
    sources,
    activeSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSource,
    clearError,
  }), [
    sources,
    activeSourceId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSource,
    clearError,
  ]);

  return (
    <SourceContext.Provider value={contextValue}>
      {children}
    </SourceContext.Provider>
  );
}

/**
 * Default export
 */
export default SourceProvider;
