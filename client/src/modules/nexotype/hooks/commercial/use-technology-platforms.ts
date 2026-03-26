'use client';

import { useContext } from 'react';
import { TechnologyPlatformContext, TechnologyPlatformContextType } from '@/modules/nexotype/providers/commercial/technology-platform-provider';
import { useTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/technology-platform.store';
import {
  type TechnologyPlatform,
  type CreateTechnologyPlatform,
  type UpdateTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/technology-platform.schemas';
import { ListTechnologyPlatformsParams } from '@/modules/nexotype/service/commercial/technology-platform.service';

/**
 * Hook to use the technology platform context
 * @throws Error if used outside of a TechnologyPlatformProvider
 */
export function useTechnologyPlatformContext(): TechnologyPlatformContextType {
  const context = useContext(TechnologyPlatformContext);

  if (!context) {
    throw new Error('useTechnologyPlatformContext must be used within a TechnologyPlatformProvider');
  }

  return context;
}

/**
 * Custom hook that combines technology platform context and store
 * to provide a simplified interface for technology platform functionality
 *
 * @returns Technology platform utilities and state
 */
export function useTechnologyPlatforms() {
  // Get data from technology platform context
  const {
    technologyPlatforms,
    activeTechnologyPlatformId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveTechnologyPlatform,
    clearError: clearContextError,
  } = useTechnologyPlatformContext();

  // Get additional actions from technology platform store
  const {
    fetchTechnologyPlatforms,
    fetchTechnologyPlatform,
    createTechnologyPlatform,
    updateTechnologyPlatform,
    deleteTechnologyPlatform,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useTechnologyPlatformStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active technology platform
  const activeTechnologyPlatform = technologyPlatforms.find((item: TechnologyPlatform) => item.id === activeTechnologyPlatformId) || null;

  return {
    // State
    technologyPlatforms,
    activeTechnologyPlatformId,
    activeTechnologyPlatform,
    isLoading,
    error,
    isInitialized,

    // TechnologyPlatform actions
    fetchTechnologyPlatforms,
    fetchTechnologyPlatform,
    createTechnologyPlatform,
    updateTechnologyPlatform,
    deleteTechnologyPlatform,
    setActiveTechnologyPlatform,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return technologyPlatforms.find((item: TechnologyPlatform) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListTechnologyPlatformsParams) => {
      return await fetchTechnologyPlatforms(filters);
    },
    createWithData: async (data: CreateTechnologyPlatform) => {
      return await createTechnologyPlatform(data);
    },
    updateWithData: async (id: number, data: UpdateTechnologyPlatform) => {
      return await updateTechnologyPlatform(id, data);
    },
  };
}

export default useTechnologyPlatforms;
