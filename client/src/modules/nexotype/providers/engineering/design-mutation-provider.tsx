'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useDesignMutationStore } from '@/modules/nexotype/store/engineering/design-mutation.store';
import { type DesignMutation } from '@/modules/nexotype/schemas/engineering/design-mutation.schemas';

/**
 * Context type for the design mutations provider
 */
export interface DesignMutationContextType {
  // State
  designMutations: DesignMutation[];
  activeDesignMutationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveDesignMutation: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const DesignMutationContext = createContext<DesignMutationContextType | null>(null);

/**
 * Provider component for design mutation-related state and actions
 */
export function DesignMutationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    designMutations,
    activeDesignMutationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDesignMutation,
    clearError,
  } = useDesignMutationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useDesignMutationStore.persist.rehydrate();
  }, []);

  // Initialize design mutations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing design mutations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DesignMutationContextType>(() => ({
    designMutations,
    activeDesignMutationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDesignMutation,
    clearError,
  }), [
    designMutations,
    activeDesignMutationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveDesignMutation,
    clearError,
  ]);

  return (
    <DesignMutationContext.Provider value={contextValue}>
      {children}
    </DesignMutationContext.Provider>
  );
}

/**
 * Default export
 */
export default DesignMutationProvider;
