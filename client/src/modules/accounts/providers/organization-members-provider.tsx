'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useOrganizationMembersStore } from '../store/organization-members.store';
import { type MemberDetail } from '../schemas/organization-members.schema';

/**
 * Context type for the organization members provider
 */
export interface OrganizationMembersContextType {
  // State
  members: MemberDetail[];
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
export const OrganizationMembersContext = createContext<OrganizationMembersContextType | null>(null);

/**
 * Provider component for organization members-related state and actions
 */
export function OrganizationMembersProvider({ 
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
    members,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  } = useOrganizationMembersStore();
  
  // Initialize members on mount if initialFetch is true and organizationId provided
  useEffect(() => {
    let isMounted = true;
    
    if (organizationId && initialFetch && (!isInitialized || activeOrganizationId !== organizationId)) {
      initialize(organizationId).catch(error => {
        if (isMounted) {
          console.error('Error initializing organization members:', error);
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
  const contextValue = useMemo<OrganizationMembersContextType>(() => ({
    members,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  }), [
    members,
    activeOrganizationId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveOrganization,
    clearError
  ]);
  
  return (
    <OrganizationMembersContext.Provider value={contextValue}>
      {children}
    </OrganizationMembersContext.Provider>
  );
}

/**
 * Default export
 */
export default OrganizationMembersProvider;