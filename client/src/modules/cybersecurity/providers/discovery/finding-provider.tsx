'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useFindingStore } from '../../store/discovery/findings.store';
import { type Finding } from '../../schemas/discovery/findings.schemas';

/**
 * Context type for the findings provider
 */
export interface FindingContextType {
  // State
  findings: Finding[];
  activeFindingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveFinding: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const FindingContext = createContext<FindingContextType | null>(null);

/**
 * Provider component for finding-related state and actions
 */
export function FindingProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    findings,
    activeFindingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinding,
    clearError
  } = useFindingStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useFindingStore.persist.rehydrate();
  }, []);

  // Initialize findings on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing findings:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<FindingContextType>(() => ({
    findings,
    activeFindingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinding,
    clearError
  }), [
    findings,
    activeFindingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveFinding,
    clearError
  ]);

  return (
    <FindingContext.Provider value={contextValue}>
      {children}
    </FindingContext.Provider>
  );
}

/**
 * Default export
 */
export default FindingProvider;
