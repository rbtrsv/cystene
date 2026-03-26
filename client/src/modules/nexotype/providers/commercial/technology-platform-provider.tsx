'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/technology-platform.store';
import { type TechnologyPlatform } from '@/modules/nexotype/schemas/commercial/technology-platform.schemas';

/**
 * Context type for the technology platforms provider
 */
export interface TechnologyPlatformContextType {
  // State
  technologyPlatforms: TechnologyPlatform[];
  activeTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TechnologyPlatformContext = createContext<TechnologyPlatformContextType | null>(null);

/**
 * Provider component for technology platform-related state and actions
 */
export function TechnologyPlatformProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    technologyPlatforms,
    activeTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTechnologyPlatform,
    clearError,
  } = useTechnologyPlatformStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTechnologyPlatformStore.persist.rehydrate();
  }, []);

  // Initialize technology platforms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing technology platforms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TechnologyPlatformContextType>(() => ({
    technologyPlatforms,
    activeTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTechnologyPlatform,
    clearError,
  }), [
    technologyPlatforms,
    activeTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTechnologyPlatform,
    clearError,
  ]);

  return (
    <TechnologyPlatformContext.Provider value={contextValue}>
      {children}
    </TechnologyPlatformContext.Provider>
  );
}

/**
 * Default export
 */
export default TechnologyPlatformProvider;
