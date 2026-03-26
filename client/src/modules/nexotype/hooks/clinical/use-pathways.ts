'use client';

import { useContext } from 'react';
import { PathwayContext, PathwayContextType } from '@/modules/nexotype/providers/clinical/pathway-provider';
import { usePathwayStore } from '@/modules/nexotype/store/clinical/pathway.store';
import {
  type Pathway,
  type CreatePathway,
  type UpdatePathway,
} from '@/modules/nexotype/schemas/clinical/pathway.schemas';
import { ListPathwaysParams } from '@/modules/nexotype/service/clinical/pathway.service';

/**
 * Hook to use the pathway context
 * @throws Error if used outside of a PathwayProvider
 */
export function usePathwayContext(): PathwayContextType {
  const context = useContext(PathwayContext);

  if (!context) {
    throw new Error('usePathwayContext must be used within a PathwayProvider');
  }

  return context;
}

/**
 * Custom hook that combines pathway context and store
 * to provide a simplified interface for pathway functionality
 *
 * @returns Pathway utilities and state
 */
export function usePathways() {
  // Get data from pathway context
  const {
    pathways,
    activePathwayId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePathway,
    clearError: clearContextError,
  } = usePathwayContext();

  // Get additional actions from pathway store
  const {
    fetchPathways,
    fetchPathway,
    createPathway,
    updatePathway,
    deletePathway,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePathwayStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active pathway
  const activePathway = pathways.find(
    (pw: Pathway) => pw.id === activePathwayId
  ) || null;

  return {
    // State
    pathways,
    activePathwayId,
    activePathway,
    isLoading,
    error,
    isInitialized,

    // Pathway actions
    fetchPathways,
    fetchPathway,
    createPathway,
    updatePathway,
    deletePathway,
    setActivePathway,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return pathways.find((pw: Pathway) => pw.id === id);
    },
    getByName: (id: number) => {
      const pw = pathways.find((p: Pathway) => p.id === id);
      return pw ? pw.name : 'Unknown Pathway';
    },
    getByKeggId: (keggId: string) => {
      return pathways.filter((p: Pathway) => p.kegg_id === keggId);
    },
    getByLongevityTier: (tier: string) => {
      return pathways.filter((p: Pathway) => p.longevity_tier === tier);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPathwaysParams) => {
      return await fetchPathways(filters);
    },
    createWithData: async (data: CreatePathway) => {
      return await createPathway(data);
    },
    updateWithData: async (id: number, data: UpdatePathway) => {
      return await updatePathway(id, data);
    },
  };
}

export default usePathways;
