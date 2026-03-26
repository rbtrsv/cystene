'use client';

import { useContext } from 'react';
import { OrganizationContext, OrganizationContextType } from '../providers/organizations-provider';
import { useOrganizationStore } from '../store/organizations.store';
import {
  type Organization,
  type CreateOrganizationInput,
  type UpdateOrganizationInput
} from '../schemas/organizations.schema';

/**
 * Hook to use the organization context
 * @throws Error if used outside of an OrganizationProvider
 */
export function useOrganizationContext(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  
  return context;
}

/**
 * Custom hook that combines organization context and store
 * to provide a simplified interface for organization functionality
 * 
 * @returns Organization utilities and state
 */
export function useOrganizations() {
  // Get data from organization context
  const {
    organizations,
    activeOrganization,
    activeOrganizationId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useOrganizationContext();

  // Get additional actions from organization store
  const {
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useOrganizationStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    organizations,
    activeOrganization,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    
    // Organization actions
    fetchOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization,
    initialize,
    clearError,
    
    // Helper methods
    hasActiveOrganization: !!activeOrganization,
    getOrganizationName: (id: number) => {
      const org = organizations.find((o: Organization) => o.id === id);
      return org ? org.name : 'Unknown Organization';
    },
    getUserRole: (organizationId: number) => {
      const org = organizations.find((o: Organization) => o.id === organizationId);
      return org ? org.role : null;
    },
    
    // Convenience wrapper functions to maintain API compatibility
    createOrganizationWithData: async (name: string) => {
      const orgData: CreateOrganizationInput = { name };
      return await createOrganization(orgData);
    },
    
    updateOrganizationWithData: async (id: number, name: string) => {
      const updateData: UpdateOrganizationInput = { name };
      return await updateOrganization(id, updateData);
    }
  };
}

export default useOrganizations;
