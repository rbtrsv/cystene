'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePathwayMembershipStore } from '@/modules/nexotype/store/knowledge_graph/pathway-membership.store';
import { type PathwayMembership } from '@/modules/nexotype/schemas/knowledge_graph/pathway-membership.schemas';

/**
 * Context type for the pathway memberships provider
 */
export interface PathwayMembershipContextType {
  // State
  pathwayMemberships: PathwayMembership[];
  activePathwayMembershipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePathwayMembership: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PathwayMembershipContext = createContext<PathwayMembershipContextType | null>(null);

/**
 * Provider component for pathway membership-related state and actions
 */
export function PathwayMembershipProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    pathwayMemberships,
    activePathwayMembershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayMembership,
    clearError,
  } = usePathwayMembershipStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePathwayMembershipStore.persist.rehydrate();
  }, []);

  // Initialize pathway memberships on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing pathway memberships:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PathwayMembershipContextType>(() => ({
    pathwayMemberships,
    activePathwayMembershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayMembership,
    clearError,
  }), [
    pathwayMemberships,
    activePathwayMembershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePathwayMembership,
    clearError,
  ]);

  return (
    <PathwayMembershipContext.Provider value={contextValue}>
      {children}
    </PathwayMembershipContext.Provider>
  );
}

/**
 * Default export
 */
export default PathwayMembershipProvider;
