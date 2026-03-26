'use client';

import { useContext } from 'react';
import {
  RecommendationContext,
  RecommendationContextType,
} from '@/modules/nexotype/providers/user/recommendation-provider';
import { useRecommendationStore } from '@/modules/nexotype/store/user/recommendation.store';
import {
  type Recommendation,
  type CreateRecommendation,
  type UpdateRecommendation,
} from '@/modules/nexotype/schemas/user/recommendation.schemas';
import { ListRecommendationsParams } from '@/modules/nexotype/service/user/recommendation.service';

/**
 * Hook to use the recommendation context
 * @throws Error if used outside of a RecommendationProvider
 */
export function useRecommendationContext(): RecommendationContextType {
  const context = useContext(RecommendationContext);

  if (!context) {
    throw new Error('useRecommendationContext must be used within a RecommendationProvider');
  }

  return context;
}

/**
 * Custom hook that combines recommendation context and store
 * to provide a simplified interface for recommendation functionality
 *
 * @returns Recommendation utilities and state
 */
export function useRecommendations() {
  // Get data from recommendation context
  const {
    recommendations,
    activeRecommendationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveRecommendation,
    clearError: clearContextError,
  } = useRecommendationContext();

  // Get additional actions from recommendation store
  const {
    fetchRecommendations,
    fetchRecommendation,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useRecommendationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active recommendation
  const activeRecommendation = recommendations.find((item: Recommendation) => item.id === activeRecommendationId) || null;

  return {
    // State
    recommendations,
    activeRecommendationId,
    activeRecommendation,
    isLoading,
    error,
    isInitialized,

    // Recommendation actions
    fetchRecommendations,
    fetchRecommendation,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    setActiveRecommendation,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return recommendations.find((item: Recommendation) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListRecommendationsParams) => {
      return await fetchRecommendations(filters);
    },
    createWithData: async (data: CreateRecommendation) => {
      return await createRecommendation(data);
    },
    updateWithData: async (id: number, data: UpdateRecommendation) => {
      return await updateRecommendation(id, data);
    },
  };
}

export default useRecommendations;
