'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePathwayScoreStore } from '@/modules/nexotype/store/user/pathway-score.store';
import { type PathwayScore } from '@/modules/nexotype/schemas/user/pathway-score.schemas';

/**
 * Context type for the pathway scores provider
 */
export interface PathwayScoreContextType {
  // State
  pathwayScores: PathwayScore[];
  activePathwayScoreId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePathwayScore: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PathwayScoreContext = createContext<PathwayScoreContextType | null>(null);

/**
 * Provider component for pathway score-related state and actions
 */
export function PathwayScoreProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    pathwayScores,
    activePathwayScoreId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayScore,
    clearError,
  } = usePathwayScoreStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePathwayScoreStore.persist.rehydrate();
  }, []);

  // Initialize pathway scores on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing pathway scores:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PathwayScoreContextType>(() => ({
    pathwayScores,
    activePathwayScoreId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayScore,
    clearError,
  }), [
    pathwayScores,
    activePathwayScoreId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayScore,
    clearError,
  ]);

  return (
    <PathwayScoreContext.Provider value={contextValue}>
      {children}
    </PathwayScoreContext.Provider>
  );
}

/**
 * Default export
 */
export default PathwayScoreProvider;
