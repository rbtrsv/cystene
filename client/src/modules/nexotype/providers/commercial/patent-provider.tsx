'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePatentStore } from '@/modules/nexotype/store/commercial/patent.store';
import { type Patent } from '@/modules/nexotype/schemas/commercial/patent.schemas';

/**
 * Context type for the patents provider
 */
export interface PatentContextType {
  // State
  patents: Patent[];
  activePatentId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePatent: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PatentContext = createContext<PatentContextType | null>(null);

/**
 * Provider component for patent-related state and actions
 */
export function PatentProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    patents,
    activePatentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatent,
    clearError,
  } = usePatentStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePatentStore.persist.rehydrate();
  }, []);

  // Initialize patents on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing patents:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PatentContextType>(() => ({
    patents,
    activePatentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatent,
    clearError,
  }), [
    patents,
    activePatentId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatent,
    clearError,
  ]);

  return (
    <PatentContext.Provider value={contextValue}>
      {children}
    </PatentContext.Provider>
  );
}

/**
 * Default export
 */
export default PatentProvider;
