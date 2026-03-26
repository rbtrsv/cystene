'use client';

import { useContext } from 'react';
import { OrganismContext, OrganismContextType } from '@/modules/nexotype/providers/omics/organism-provider';
import { useOrganismStore } from '@/modules/nexotype/store/omics/organism.store';
import {
  type Organism,
  type CreateOrganism,
  type UpdateOrganism,
} from '@/modules/nexotype/schemas/omics/organism.schemas';
import { ListOrganismsParams } from '@/modules/nexotype/service/omics/organism.service';

/**
 * Hook to use the organism context
 * @throws Error if used outside of an OrganismProvider
 */
export function useOrganismContext(): OrganismContextType {
  const context = useContext(OrganismContext);

  if (!context) {
    throw new Error('useOrganismContext must be used within an OrganismProvider');
  }

  return context;
}

/**
 * Custom hook that combines organism context and store
 * to provide a simplified interface for organism functionality
 *
 * @returns Organism utilities and state
 */
export function useOrganisms() {
  // Get data from organism context
  const {
    organisms,
    activeOrganismId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOrganism,
    clearError: clearContextError,
  } = useOrganismContext();

  // Get additional actions from organism store
  const {
    fetchOrganisms,
    fetchOrganism,
    createOrganism,
    updateOrganism,
    deleteOrganism,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useOrganismStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active organism
  const activeOrganism = organisms.find(
    (org: Organism) => org.id === activeOrganismId
  ) || null;

  return {
    // State
    organisms,
    activeOrganismId,
    activeOrganism,
    isLoading,
    error,
    isInitialized,

    // Organism actions
    fetchOrganisms,
    fetchOrganism,
    createOrganism,
    updateOrganism,
    deleteOrganism,
    setActiveOrganism,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return organisms.find((org: Organism) => org.id === id);
    },
    getByName: (id: number) => {
      const org = organisms.find((o: Organism) => o.id === id);
      return org ? org.scientific_name : 'Unknown Organism';
    },
    getByNcbiTaxonomyId: (ncbiTaxonomyId: number) => {
      return organisms.find((o: Organism) => o.ncbi_taxonomy_id === ncbiTaxonomyId);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListOrganismsParams) => {
      return await fetchOrganisms(filters);
    },
    createWithData: async (data: CreateOrganism) => {
      return await createOrganism(data);
    },
    updateWithData: async (id: number, data: UpdateOrganism) => {
      return await updateOrganism(id, data);
    },
  };
}

export default useOrganisms;
