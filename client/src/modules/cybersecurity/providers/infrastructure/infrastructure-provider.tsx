'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useInfrastructureStore } from '../../store/infrastructure/infrastructure.store';
import { type Infrastructure } from '../../schemas/infrastructure/infrastructure.schemas';

/**
 * Context type for the infrastructure provider
 */
export interface InfrastructureContextType {
  // State
  infrastructures: Infrastructure[];
  activeInfrastructureId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveInfrastructure: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const InfrastructureContext = createContext<InfrastructureContextType | null>(null);

/**
 * Provider component for infrastructure-related state and actions
 */
export function InfrastructureProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    infrastructures,
    activeInfrastructureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveInfrastructure,
    clearError
  } = useInfrastructureStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useInfrastructureStore.persist.rehydrate();
  }, []);

  // Initialize infrastructure on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing infrastructure:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<InfrastructureContextType>(() => ({
    infrastructures,
    activeInfrastructureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveInfrastructure,
    clearError
  }), [
    infrastructures,
    activeInfrastructureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveInfrastructure,
    clearError
  ]);

  return (
    <InfrastructureContext.Provider value={contextValue}>
      {children}
    </InfrastructureContext.Provider>
  );
}

/**
 * Default export
 */
export default InfrastructureProvider;
