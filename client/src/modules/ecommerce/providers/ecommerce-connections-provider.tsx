'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useConnectionStore } from '../store/ecommerce-connections.store';
import { type Connection } from '../schemas/ecommerce-connections.schemas';

/**
 * Context type for the connections provider
 */
export interface ConnectionContextType {
  // State
  connections: Connection[];
  activeConnection: Connection | undefined;
  activeConnectionId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  clearError: () => void;
}

// Create the context
export const ConnectionContext = createContext<ConnectionContextType | null>(null);

/**
 * Provider component for connection-related state and actions
 */
export function ConnectionProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    connections,
    activeConnectionId,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError,
  } = useConnectionStore();

  // Get active connection based on activeConnectionId
  const activeConnection = useMemo(
    () => connections.find((conn) => conn.id === activeConnectionId),
    [connections, activeConnectionId]
  );

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useConnectionStore.persist.rehydrate();
  }, []);

  // Initialize connections on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing connections:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ConnectionContextType>(
    () => ({
      connections,
      activeConnection,
      activeConnectionId,
      isLoading,
      error,
      isInitialized,
      initialize,
      clearError,
    }),
    [
      connections,
      activeConnection,
      activeConnectionId,
      isLoading,
      error,
      isInitialized,
      initialize,
      clearError,
    ]
  );

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
}

/**
 * Default export
 */
export default ConnectionProvider;
