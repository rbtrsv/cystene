'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useEntityDealProfileStore } from '../../store/deal/entity-deal-profile.store';
import { type EntityDealProfile } from '../../schemas/deal/entity-deal-profile.schemas';

/**
 * Context type for the entity deal profile provider
 */
export interface EntityDealProfileContextType {
  // State
  entityDealProfiles: EntityDealProfile[];
  activeEntityDealProfileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveEntityDealProfile: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const EntityDealProfileContext = createContext<EntityDealProfileContextType | null>(null);

/**
 * Provider component for entity deal profile related state and actions
 */
export function EntityDealProfileProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    entityDealProfiles,
    activeEntityDealProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntityDealProfile,
    clearError,
  } = useEntityDealProfileStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useEntityDealProfileStore.persist.rehydrate();
  }, []);

  // Initialize entity deal profiles on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing entity deal profiles:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<EntityDealProfileContextType>(() => ({
    entityDealProfiles,
    activeEntityDealProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntityDealProfile,
    clearError,
  }), [
    entityDealProfiles,
    activeEntityDealProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntityDealProfile,
    clearError
  ]);

  return (
    <EntityDealProfileContext.Provider value={contextValue}>
      {children}
    </EntityDealProfileContext.Provider>
  );
}

/**
 * Default export
 */
export default EntityDealProfileProvider;
