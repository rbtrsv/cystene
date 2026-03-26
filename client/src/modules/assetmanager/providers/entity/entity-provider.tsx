'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useEntityStore } from '../../store/entity/entity.store';
import { type Entity } from '../../schemas/entity/entity.schemas';

/**
 * Context type for the entities provider
 */
export interface EntityContextType {
  // State
  entities: Entity[];
  activeEntityId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveEntity: (entityId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const EntityContext = createContext<EntityContextType | null>(null);

/**
 * Provider component for entity-related state and actions
 */
export function EntityProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    entities,
    activeEntityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntity,
    clearError
  } = useEntityStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useEntityStore.persist.rehydrate();
  }, []);

  // Initialize entities on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing entities:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<EntityContextType>(() => ({
    entities,
    activeEntityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntity,
    clearError
  }), [
    entities,
    activeEntityId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveEntity,
    clearError
  ]);

  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
}

/**
 * Default export
 */
export default EntityProvider;
