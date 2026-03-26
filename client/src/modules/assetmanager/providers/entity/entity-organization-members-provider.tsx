'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useEntityOrganizationMembersStore } from '../../store/entity/entity-organization-members.store';
import { type EntityOrganizationMember } from '../../schemas/entity/entity-organization-members.schema';
import { ListEntityOrganizationMembersParams } from '../../service/entity/entity-organization-members.service';

/**
 * Context type for the entity organization members provider
 */
export interface EntityOrganizationMembersContextType {
  // State
  members: EntityOrganizationMember[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListEntityOrganizationMembersParams) => Promise<void>;
  clearError: () => void;
}

// Create the context
export const EntityOrganizationMembersContext = createContext<EntityOrganizationMembersContextType | null>(null);

/**
 * Provider component for entity organization members-related state and actions
 */
export function EntityOrganizationMembersProvider({
  children,
  initialFetch = false,
  entityId,
  organizationId
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
  entityId?: number;
  organizationId?: number;
}) {
  // Get state and actions from the store
  const {
    members,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useEntityOrganizationMembersStore();

  // Initialize members on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      const params: ListEntityOrganizationMembersParams = {};
      if (entityId) params.entity_id = entityId;
      if (organizationId) params.organization_id = organizationId;

      initialize(params).catch(error => {
        if (isMounted) {
          console.error('Error initializing entity organization members:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, entityId, organizationId, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<EntityOrganizationMembersContextType>(() => ({
    members,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [
    members,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  ]);

  return (
    <EntityOrganizationMembersContext.Provider value={contextValue}>
      {children}
    </EntityOrganizationMembersContext.Provider>
  );
}

/**
 * Default export
 */
export default EntityOrganizationMembersProvider;
