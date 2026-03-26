'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useContextAttributeStore } from '@/modules/nexotype/store/knowledge_graph/context-attribute.store';
import { type ContextAttribute } from '@/modules/nexotype/schemas/knowledge_graph/context-attribute.schemas';

/**
 * Context type for the context attributes provider
 */
export interface ContextAttributeContextType {
  // State
  contextAttributes: ContextAttribute[];
  activeContextAttributeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveContextAttribute: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ContextAttributeContext = createContext<ContextAttributeContextType | null>(null);

/**
 * Provider component for context attribute-related state and actions
 */
export function ContextAttributeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    contextAttributes,
    activeContextAttributeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveContextAttribute,
    clearError,
  } = useContextAttributeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useContextAttributeStore.persist.rehydrate();
  }, []);

  // Initialize context attributes on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing context attributes:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ContextAttributeContextType>(() => ({
    contextAttributes,
    activeContextAttributeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveContextAttribute,
    clearError,
  }), [
    contextAttributes,
    activeContextAttributeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveContextAttribute,
    clearError,
  ]);

  return (
    <ContextAttributeContext.Provider value={contextValue}>
      {children}
    </ContextAttributeContext.Provider>
  );
}

/**
 * Default export
 */
export default ContextAttributeProvider;
