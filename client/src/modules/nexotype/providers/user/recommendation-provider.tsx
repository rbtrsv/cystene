'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useRecommendationStore } from '@/modules/nexotype/store/user/recommendation.store';
import { type Recommendation } from '@/modules/nexotype/schemas/user/recommendation.schemas';

/**
 * Context type for the recommendations provider
 */
export interface RecommendationContextType {
  // State
  recommendations: Recommendation[];
  activeRecommendationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveRecommendation: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const RecommendationContext = createContext<RecommendationContextType | null>(null);

/**
 * Provider component for recommendation-related state and actions
 */
export function RecommendationProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    recommendations,
    activeRecommendationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRecommendation,
    clearError,
  } = useRecommendationStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useRecommendationStore.persist.rehydrate();
  }, []);

  // Initialize recommendations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing recommendations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RecommendationContextType>(() => ({
    recommendations,
    activeRecommendationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRecommendation,
    clearError,
  }), [
    recommendations,
    activeRecommendationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveRecommendation,
    clearError,
  ]);

  return (
    <RecommendationContext.Provider value={contextValue}>
      {children}
    </RecommendationContext.Provider>
  );
}

/**
 * Default export
 */
export default RecommendationProvider;
