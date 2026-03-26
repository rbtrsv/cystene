'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useEntityOrganizationInvitationsStore } from '../../store/entity/entity-organization-invitations.store';
import { type EntityOrganizationInvitation } from '../../schemas/entity/entity-organization-invitations.schema';
import { ListEntityOrganizationInvitationsParams } from '../../service/entity/entity-organization-invitations.service';

/**
 * Context type for the entity organization invitations provider
 */
export interface EntityOrganizationInvitationsContextType {
  // State
  invitations: EntityOrganizationInvitation[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListEntityOrganizationInvitationsParams) => Promise<void>;
  clearError: () => void;
}

// Create the context
export const EntityOrganizationInvitationsContext = createContext<EntityOrganizationInvitationsContextType | null>(null);

/**
 * Provider component for entity organization invitations-related state and actions
 */
export function EntityOrganizationInvitationsProvider({
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
    invitations,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useEntityOrganizationInvitationsStore();

  // Initialize invitations on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      const params: ListEntityOrganizationInvitationsParams = {};
      if (entityId) params.entity_id = entityId;
      if (organizationId) params.organization_id = organizationId;

      initialize(params).catch(error => {
        if (isMounted) {
          console.error('Error initializing entity organization invitations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, entityId, organizationId, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<EntityOrganizationInvitationsContextType>(() => ({
    invitations,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [
    invitations,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  ]);

  return (
    <EntityOrganizationInvitationsContext.Provider value={contextValue}>
      {children}
    </EntityOrganizationInvitationsContext.Provider>
  );
}

/**
 * Default export
 */
export default EntityOrganizationInvitationsProvider;
