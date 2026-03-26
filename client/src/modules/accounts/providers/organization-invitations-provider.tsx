'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOrganizationInvitationsStore } from '../store/organization-invitations.store';
import { type InvitationDetail } from '../schemas/organization-invitations.schema';

/**
 * Context type for the organization invitations provider
 */
export interface OrganizationInvitationsContextType {
  // State
  invitations: InvitationDetail[];
  myInvitations: InvitationDetail[];
  activeOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (organizationId: number) => Promise<void>;
  setActiveOrganization: (organizationId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const OrganizationInvitationsContext = createContext<OrganizationInvitationsContextType | null>(null);

/**
 * Provider component for organization invitations-related state and actions
 */
export function OrganizationInvitationsProvider({
  children,
  organizationId = null,
  initialFetch = false
}: {
  children: React.ReactNode;
  organizationId?: number | null;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    invitations,
    myInvitations,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  } = useOrganizationInvitationsStore();

  // Initialize invitations on mount if initialFetch is true and organizationId provided
  useEffect(() => {
    let isMounted = true;

    if (organizationId && initialFetch && (!isInitialized || activeOrganizationId !== organizationId)) {
      initialize(organizationId).catch(error => {
        if (isMounted) {
          console.error('Error initializing organization invitations:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [organizationId, initialFetch, isInitialized, activeOrganizationId, initialize]);

  // Update active organization when organizationId prop changes
  useEffect(() => {
    if (organizationId !== activeOrganizationId) {
      setActiveOrganization(organizationId);
    }
  }, [organizationId, activeOrganizationId, setActiveOrganization]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OrganizationInvitationsContextType>(() => ({
    invitations,
    myInvitations,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  }), [
    invitations,
    myInvitations,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  ]);

  return (
    <OrganizationInvitationsContext.Provider value={contextValue}>
      {children}
    </OrganizationInvitationsContext.Provider>
  );
}

/**
 * Default export
 */
export default OrganizationInvitationsProvider;
