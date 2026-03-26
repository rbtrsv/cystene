'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useConstructStore } from '@/modules/nexotype/store/engineering/construct.store';
import { type Construct } from '@/modules/nexotype/schemas/engineering/construct.schemas';

/**
 * Context type for the constructs provider
 */
export interface ConstructContextType {
  // State
  constructs: Construct[];
  activeConstructId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveConstruct: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ConstructContext = createContext<ConstructContextType | null>(null);

/**
 * Provider component for construct-related state and actions
 */
export function ConstructProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    constructs,
    activeConstructId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveConstruct,
    clearError,
  } = useConstructStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useConstructStore.persist.rehydrate();
  }, []);

  // Initialize constructs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing constructs:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ConstructContextType>(() => ({
    constructs,
    activeConstructId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveConstruct,
    clearError,
  }), [
    constructs,
    activeConstructId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveConstruct,
    clearError,
  ]);

  return (
    <ConstructContext.Provider value={contextValue}>
      {children}
    </ConstructContext.Provider>
  );
}

/**
 * Default export
 */
export default ConstructProvider;
