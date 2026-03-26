'use client';

import { useContext } from 'react';
import { PathwayScoreContext, PathwayScoreContextType } from '@/modules/nexotype/providers/user/pathway-score-provider';
import { usePathwayScoreStore } from '@/modules/nexotype/store/user/pathway-score.store';
import {
  type PathwayScore,
  type CreatePathwayScore,
  type UpdatePathwayScore,
} from '@/modules/nexotype/schemas/user/pathway-score.schemas';
import { ListPathwayScoresParams } from '@/modules/nexotype/service/user/pathway-score.service';

/**
 * Hook to use the pathway score context
 * @throws Error if used outside of a PathwayScoreProvider
 */
export function usePathwayScoreContext(): PathwayScoreContextType {
  const context = useContext(PathwayScoreContext);

  if (!context) {
    throw new Error('usePathwayScoreContext must be used within a PathwayScoreProvider');
  }

  return context;
}

/**
 * Custom hook that combines pathway score context and store
 * to provide a simplified interface for pathway score functionality
 *
 * @returns Pathway score utilities and state
 */
export function usePathwayScores() {
  // Get data from pathway score context
  const {
    pathwayScores,
    activePathwayScoreId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePathwayScore,
    clearError: clearContextError,
  } = usePathwayScoreContext();

  // Get additional actions from pathway score store
  const {
    fetchPathwayScores,
    fetchPathwayScore,
    createPathwayScore,
    updatePathwayScore,
    deletePathwayScore,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePathwayScoreStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active pathway score
  const activePathwayScore = pathwayScores.find((item: PathwayScore) => item.id === activePathwayScoreId) || null;

  return {
    // State
    pathwayScores,
    activePathwayScoreId,
    activePathwayScore,
    isLoading,
    error,
    isInitialized,

    // PathwayScore actions
    fetchPathwayScores,
    fetchPathwayScore,
    createPathwayScore,
    updatePathwayScore,
    deletePathwayScore,
    setActivePathwayScore,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return pathwayScores.find((item: PathwayScore) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPathwayScoresParams) => {
      return await fetchPathwayScores(filters);
    },
    createWithData: async (data: CreatePathwayScore) => {
      return await createPathwayScore(data);
    },
    updateWithData: async (id: number, data: UpdatePathwayScore) => {
      return await updatePathwayScore(id, data);
    },
  };
}

export default usePathwayScores;
