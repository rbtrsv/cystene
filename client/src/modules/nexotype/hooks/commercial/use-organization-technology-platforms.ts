'use client';

import { useContext } from 'react';
import { OrganizationTechnologyPlatformContext, OrganizationTechnologyPlatformContextType } from '@/modules/nexotype/providers/commercial/organization-technology-platform-provider';
import { useOrganizationTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/organization-technology-platform.store';
import {
  type OrganizationTechnologyPlatform,
  type CreateOrganizationTechnologyPlatform,
  type UpdateOrganizationTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/organization-technology-platform.schemas';
import { ListOrganizationTechnologyPlatformsParams } from '@/modules/nexotype/service/commercial/organization-technology-platform.service';

/**
 * Hook to use the organization technology platform context
 * @throws Error if used outside of an OrganizationTechnologyPlatformProvider
 */
export function useOrganizationTechnologyPlatformContext(): OrganizationTechnologyPlatformContextType {
  const context = useContext(OrganizationTechnologyPlatformContext);

  if (!context) {
    throw new Error('useOrganizationTechnologyPlatformContext must be used within an OrganizationTechnologyPlatformProvider');
  }

  return context;
}

/**
 * Custom hook that combines organization technology platform context and store
 * to provide a simplified interface for organization technology platform functionality
 *
 * @returns Organization technology platform utilities and state
 */
export function useOrganizationTechnologyPlatforms() {
  // Get data from organization technology platform context
  const {
    organizationTechnologyPlatforms,
    activeOrganizationTechnologyPlatformId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveOrganizationTechnologyPlatform,
    clearError: clearContextError,
  } = useOrganizationTechnologyPlatformContext();

  // Get additional actions from organization technology platform store
  const {
    fetchOrganizationTechnologyPlatforms,
    fetchOrganizationTechnologyPlatform,
    createOrganizationTechnologyPlatform,
    updateOrganizationTechnologyPlatform,
    deleteOrganizationTechnologyPlatform,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useOrganizationTechnologyPlatformStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active organization technology platform
  const activeOrganizationTechnologyPlatform = organizationTechnologyPlatforms.find((item: OrganizationTechnologyPlatform) => item.id === activeOrganizationTechnologyPlatformId) || null;

  return {
    // State
    organizationTechnologyPlatforms,
    activeOrganizationTechnologyPlatformId,
    activeOrganizationTechnologyPlatform,
    isLoading,
    error,
    isInitialized,

    // OrganizationTechnologyPlatform actions
    fetchOrganizationTechnologyPlatforms,
    fetchOrganizationTechnologyPlatform,
    createOrganizationTechnologyPlatform,
    updateOrganizationTechnologyPlatform,
    deleteOrganizationTechnologyPlatform,
    setActiveOrganizationTechnologyPlatform,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return organizationTechnologyPlatforms.find((item: OrganizationTechnologyPlatform) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListOrganizationTechnologyPlatformsParams) => {
      return await fetchOrganizationTechnologyPlatforms(filters);
    },
    createWithData: async (data: CreateOrganizationTechnologyPlatform) => {
      return await createOrganizationTechnologyPlatform(data);
    },
    updateWithData: async (id: number, data: UpdateOrganizationTechnologyPlatform) => {
      return await updateOrganizationTechnologyPlatform(id, data);
    },
  };
}

export default useOrganizationTechnologyPlatforms;
