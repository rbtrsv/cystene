'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSyndicateMembersStore } from '../../store/entity/syndicate-member.store';
import { type SyndicateMember } from '../../schemas/entity/syndicate-member.schemas';
import { ListSyndicateMembersParams } from '../../service/entity/syndicate-member.service';

/**
 * Context type for the syndicate members provider
 */
export interface SyndicateMembersContextType {
  // State
  members: SyndicateMember[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (params?: ListSyndicateMembersParams) => Promise<void>;
  clearError: () => void;
}

// Create the context
export const SyndicateMembersContext = createContext<SyndicateMembersContextType | null>(null);

/**
 * Provider component for syndicate members-related state and actions
 */
export function SyndicateMembersProvider({
  children,
  initialFetch = false,
  syndicateId,
  memberEntityId
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
  syndicateId?: number;
  memberEntityId?: number;
}) {
  // Get state and actions from the store
  const {
    members,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useSyndicateMembersStore();

  // Initialize members on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      const params: ListSyndicateMembersParams = {};
      if (syndicateId) params.syndicate_id = syndicateId;
      if (memberEntityId) params.member_entity_id = memberEntityId;

      initialize(params).catch(error => {
        if (isMounted) {
          console.error('Error initializing syndicate members:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, syndicateId, memberEntityId, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SyndicateMembersContextType>(() => ({
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
    <SyndicateMembersContext.Provider value={contextValue}>
      {children}
    </SyndicateMembersContext.Provider>
  );
}

/**
 * Default export
 */
export default SyndicateMembersProvider;
