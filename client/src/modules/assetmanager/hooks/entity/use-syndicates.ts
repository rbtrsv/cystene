'use client';

import { useContext } from 'react';
import { SyndicateContext, SyndicateContextType } from '../../providers/entity/syndicate-provider';
import { useSyndicateStore } from '../../store/entity/syndicate.store';
import {
  type Syndicate,
  type CreateSyndicate,
  type UpdateSyndicate,
} from '../../schemas/entity/syndicate.schemas';
import { ListSyndicatesParams } from '../../service/entity/syndicate.service';

/**
 * Hook to use the syndicate context
 * @throws Error if used outside of a SyndicateProvider
 */
export function useSyndicateContext(): SyndicateContextType {
  const context = useContext(SyndicateContext);

  if (!context) {
    throw new Error('useSyndicateContext must be used within a SyndicateProvider');
  }

  return context;
}

/**
 * Custom hook that combines syndicate context and store
 * to provide a simplified interface for syndicate functionality
 *
 * @returns Syndicate utilities and state
 */
export function useSyndicates() {
  // Get data from syndicate context
  const {
    syndicates,
    activeSyndicateId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveSyndicate,
    clearError: clearContextError
  } = useSyndicateContext();

  // Get additional actions from syndicate store
  const {
    fetchSyndicates,
    fetchSyndicate,
    createSyndicate,
    updateSyndicate,
    deleteSyndicate,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useSyndicateStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active syndicate
  const activeSyndicate = syndicates.find((syndicate: Syndicate) => syndicate.id === activeSyndicateId) || null;

  return {
    // State
    syndicates,
    activeSyndicateId,
    activeSyndicate,
    isLoading,
    error,
    isInitialized,

    // Syndicate actions
    fetchSyndicates,
    fetchSyndicate,
    createSyndicate,
    updateSyndicate,
    deleteSyndicate,
    setActiveSyndicate,
    initialize,
    clearError,

    // Helper methods
    getSyndicateById: (id: number) => {
      return syndicates.find((syndicate: Syndicate) => syndicate.id === id);
    },
    getSyndicateName: (id: number) => {
      const syndicate = syndicates.find((s: Syndicate) => s.id === id);
      return syndicate ? syndicate.name : 'Unknown Syndicate';
    },
    getSyndicatesByEntity: (entityId: number) => {
      return syndicates.filter((s: Syndicate) => s.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchSyndicatesWithFilters: async (filters: ListSyndicatesParams) => {
      return await fetchSyndicates(filters);
    },
    createSyndicateWithData: async (data: CreateSyndicate) => {
      return await createSyndicate(data);
    },
    updateSyndicateWithData: async (id: number, data: UpdateSyndicate) => {
      return await updateSyndicate(id, data);
    }
  };
}

export default useSyndicates;
