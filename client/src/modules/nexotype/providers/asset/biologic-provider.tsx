'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useBiologicStore } from '@/modules/nexotype/store/asset/biologic.store';
import { type Biologic } from '@/modules/nexotype/schemas/asset/biologic.schemas';

/**
 * Context type for the biologics provider
 */
export interface BiologicContextType {
  // State
  biologics: Biologic[];
  activeBiologicId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveBiologic: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const BiologicContext = createContext<BiologicContextType | null>(null);

/**
 * Provider component for biologic-related state and actions
 */
export function BiologicProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    biologics,
    activeBiologicId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologic,
    clearError,
  } = useBiologicStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useBiologicStore.persist.rehydrate();
  }, []);

  // Initialize biologics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing biologics:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BiologicContextType>(() => ({
    biologics,
    activeBiologicId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologic,
    clearError,
  }), [
    biologics,
    activeBiologicId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveBiologic,
    clearError,
  ]);

  return (
    <BiologicContext.Provider value={contextValue}>
      {children}
    </BiologicContext.Provider>
  );
}

/**
 * Default export
 */
export default BiologicProvider;
