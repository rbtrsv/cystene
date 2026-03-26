'use client';

import { useContext } from 'react';
import { EntityDealProfileContext, EntityDealProfileContextType } from '../../providers/deal/entity-deal-profile-provider';
import { useEntityDealProfileStore } from '../../store/deal/entity-deal-profile.store';
import {
  type EntityDealProfile,
  type CreateEntityDealProfile,
  type UpdateEntityDealProfile,
} from '../../schemas/deal/entity-deal-profile.schemas';
import { ListEntityDealProfilesParams } from '../../service/deal/entity-deal-profile.service';

/**
 * Hook to use the entity deal profiles context
 * @throws Error if used outside of the provider
 */
export function useEntityDealProfileContext(): EntityDealProfileContextType {
  const context = useContext(EntityDealProfileContext);

  if (!context) {
    throw new Error('useEntityDealProfileContext must be used within a EntityDealProfileProvider');
  }

  return context;
}

/**
 * Custom hook that combines entity deal profiles context and store
 * to provide a simplified interface for entity deal profiles functionality
 *
 * @returns Entity Deal Profiles utilities and state
 */
export function useEntityDealProfiles() {
  // Get data from entity deal profile context
  const {
    entityDealProfiles,
    activeEntityDealProfileId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveEntityDealProfile,
    clearError: clearContextError
  } = useEntityDealProfileContext();

  // Get additional actions from entity deal profile store
  const {
    fetchEntityDealProfiles,
    fetchEntityDealProfile,
    createEntityDealProfile,
    updateEntityDealProfile,
    deleteEntityDealProfile,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useEntityDealProfileStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active entity deal profile
  const activeEntityDealProfile = entityDealProfiles.find(
    (profile: EntityDealProfile) => profile.id === activeEntityDealProfileId
  ) || null;

  return {
    // State
    entityDealProfiles,
    activeEntityDealProfileId,
    activeEntityDealProfile,
    isLoading,
    error,
    isInitialized,

    // Entity deal profile actions
    fetchEntityDealProfiles,
    fetchEntityDealProfile,
    createEntityDealProfile,
    updateEntityDealProfile,
    deleteEntityDealProfile,
    setActiveEntityDealProfile,
    initialize,
    clearError,

    // Helper methods
    getProfileById: (id: number) => {
      return entityDealProfiles.find((profile: EntityDealProfile) => profile.id === id);
    },
    getProfileByEntity: (entityId: number) => {
      return entityDealProfiles.find((profile: EntityDealProfile) => profile.entity_id === entityId);
    },
    getProfilesByType: (entityType: string) => {
      return entityDealProfiles.filter((profile: EntityDealProfile) => profile.entity_type === entityType);
    },

    // Convenience wrapper functions
    fetchProfilesWithFilters: async (filters: ListEntityDealProfilesParams) => {
      return await fetchEntityDealProfiles(filters);
    },
    createProfileWithData: async (data: CreateEntityDealProfile) => {
      return await createEntityDealProfile(data);
    },
    updateProfileWithData: async (id: number, data: UpdateEntityDealProfile) => {
      return await updateEntityDealProfile(id, data);
    }
  };
}

export default useEntityDealProfiles;
