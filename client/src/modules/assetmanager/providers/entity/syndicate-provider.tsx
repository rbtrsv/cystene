'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSyndicateStore } from '../../store/entity/syndicate.store';
import { type Syndicate } from '../../schemas/entity/syndicate.schemas';

/**
 * Context type for the syndicates provider
 */
export interface SyndicateContextType {
  // State
  syndicates: Syndicate[];
  activeSyndicateId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveSyndicate: (syndicateId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SyndicateContext = createContext<SyndicateContextType | null>(null);

/**
 * Provider component for syndicate-related state and actions
 */
export function SyndicateProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    syndicates,
    activeSyndicateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSyndicate,
    clearError
  } = useSyndicateStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSyndicateStore.persist.rehydrate();
  }, []);

  // Initialize syndicates on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing syndicates:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SyndicateContextType>(() => ({
    syndicates,
    activeSyndicateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSyndicate,
    clearError
  }), [
    syndicates,
    activeSyndicateId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSyndicate,
    clearError
  ]);

  return (
    <SyndicateContext.Provider value={contextValue}>
      {children}
    </SyndicateContext.Provider>
  );
}

/**
 * Default export
 */
export default SyndicateProvider;
