'use client';

import { useContext } from 'react';
import { PathwayMembershipContext, PathwayMembershipContextType } from '@/modules/nexotype/providers/knowledge_graph/pathway-membership-provider';
import { usePathwayMembershipStore } from '@/modules/nexotype/store/knowledge_graph/pathway-membership.store';
import {
  type PathwayMembership,
  type CreatePathwayMembership,
  type UpdatePathwayMembership,
} from '@/modules/nexotype/schemas/knowledge_graph/pathway-membership.schemas';
import { ListPathwayMembershipsParams } from '@/modules/nexotype/service/knowledge_graph/pathway-membership.service';

/**
 * Hook to use the pathway membership context
 * @throws Error if used outside of a PathwayMembershipProvider
 */
export function usePathwayMembershipContext(): PathwayMembershipContextType {
  const context = useContext(PathwayMembershipContext);
  if (!context) {
    throw new Error('usePathwayMembershipContext must be used within a PathwayMembershipProvider');
  }
  return context;
}

/**
 * Custom hook that combines pathway membership context and store
 * to provide a simplified interface for pathway membership functionality.
 *
 * @returns Pathway membership utilities and state
 */
export function usePathwayMemberships() {
  // Get data from pathway membership context
  const {
    pathwayMemberships,
    activePathwayMembershipId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePathwayMembership,
    clearError: clearContextError,
  } = usePathwayMembershipContext();

  // Get additional actions from pathway membership store
  const {
    fetchPathwayMemberships,
    fetchPathwayMembership,
    createPathwayMembership,
    updatePathwayMembership,
    deletePathwayMembership,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePathwayMembershipStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active pathway membership
  const activePathwayMembership = pathwayMemberships.find(
    (pathwayMembership: PathwayMembership) => pathwayMembership.id === activePathwayMembershipId
  ) || null;

  return {
    // State
    pathwayMemberships,
    activePathwayMembershipId,
    activePathwayMembership,
    isLoading,
    error,
    isInitialized,
    fetchPathwayMemberships,
    fetchPathwayMembership,
    createPathwayMembership,
    updatePathwayMembership,
    deletePathwayMembership,
    setActivePathwayMembership,
    initialize,
    clearError,
    // Helper methods
    getById: (id: number) => {
      return pathwayMemberships.find((pathwayMembership: PathwayMembership) => pathwayMembership.id === id);
    },
    // entity-specific helpers — filter pathway memberships by protein
    getByProteinId: (proteinId: number) => {
      return pathwayMemberships.filter((pathwayMembership: PathwayMembership) => pathwayMembership.protein_id === proteinId);
    },
    fetchWithFilters: async (filters: ListPathwayMembershipsParams) => {
      return await fetchPathwayMemberships(filters);
    },
    createWithData: async (data: CreatePathwayMembership) => {
      return await createPathwayMembership(data);
    },
    updateWithData: async (id: number, data: UpdatePathwayMembership) => {
      return await updatePathwayMembership(id, data);
    },
  };
}

export default usePathwayMemberships;
