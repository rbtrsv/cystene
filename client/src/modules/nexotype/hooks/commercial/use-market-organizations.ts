'use client';

import { useContext } from 'react';
import { MarketOrganizationContext, MarketOrganizationContextType } from '@/modules/nexotype/providers/commercial/market-organization-provider';
import { useMarketOrganizationStore } from '@/modules/nexotype/store/commercial/market-organization.store';
import {
  type MarketOrganization,
  type CreateMarketOrganization,
  type UpdateMarketOrganization,
  type OrgType,
  type OrgStatus,
} from '@/modules/nexotype/schemas/commercial/market-organization.schemas';
import { ListMarketOrganizationsParams } from '@/modules/nexotype/service/commercial/market-organization.service';

/**
 * Hook to use the market organization context
 * @throws Error if used outside of a MarketOrganizationProvider
 */
export function useMarketOrganizationContext(): MarketOrganizationContextType {
  const context = useContext(MarketOrganizationContext);

  if (!context) {
    throw new Error('useMarketOrganizationContext must be used within a MarketOrganizationProvider');
  }

  return context;
}

/**
 * Custom hook that combines market organization context and store
 * to provide a simplified interface for market organization functionality
 *
 * @returns Market organization utilities and state
 */
export function useMarketOrganizations() {
  // Get data from market organization context
  const {
    marketOrganizations,
    activeMarketOrganizationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveMarketOrganization,
    clearError: clearContextError,
  } = useMarketOrganizationContext();

  // Get additional actions from market organization store
  const {
    fetchMarketOrganizations,
    fetchMarketOrganization,
    createMarketOrganization,
    updateMarketOrganization,
    deleteMarketOrganization,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useMarketOrganizationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active market organization
  const activeMarketOrganization = marketOrganizations.find(
    (org: MarketOrganization) => org.id === activeMarketOrganizationId
  ) || null;

  return {
    // State
    marketOrganizations,
    activeMarketOrganizationId,
    activeMarketOrganization,
    isLoading,
    error,
    isInitialized,

    // Market organization actions
    fetchMarketOrganizations,
    fetchMarketOrganization,
    createMarketOrganization,
    updateMarketOrganization,
    deleteMarketOrganization,
    setActiveMarketOrganization,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return marketOrganizations.find((org: MarketOrganization) => org.id === id);
    },
    getByLegalName: (id: number) => {
      const org = marketOrganizations.find((o: MarketOrganization) => o.id === id);
      return org ? org.legal_name : 'Unknown Organization';
    },
    getByOrgType: (orgType: OrgType) => {
      return marketOrganizations.filter((o: MarketOrganization) => o.org_type === orgType);
    },
    getByStatus: (status: OrgStatus) => {
      return marketOrganizations.filter((o: MarketOrganization) => o.status === status);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListMarketOrganizationsParams) => {
      return await fetchMarketOrganizations(filters);
    },
    createWithData: async (data: CreateMarketOrganization) => {
      return await createMarketOrganization(data);
    },
    updateWithData: async (id: number, data: UpdateMarketOrganization) => {
      return await updateMarketOrganization(id, data);
    },
  };
}

export default useMarketOrganizations;
