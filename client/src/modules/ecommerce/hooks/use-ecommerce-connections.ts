'use client';

import { useContext } from 'react';
import { ConnectionContext, ConnectionContextType } from '../providers/ecommerce-connections-provider';
import { useConnectionStore } from '../store/ecommerce-connections.store';
import { type Connection } from '../schemas/ecommerce-connections.schemas';

/**
 * Hook to use the connection context
 * @throws Error if used outside of a ConnectionProvider
 */
export function useConnectionContext(): ConnectionContextType {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }

  return context;
}

/**
 * Custom hook that combines connection context and store
 * to provide a simplified interface for connection functionality
 *
 * @returns Connection utilities and state
 */
export function useConnections() {
  // Get data from connection context
  const {
    connections,
    activeConnection,
    activeConnectionId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError,
  } = useConnectionContext();

  // Get additional actions from connection store
  const {
    fetchConnections,
    fetchConnection,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    setActiveConnection,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useConnectionStore();

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
    connections,
    activeConnection,
    activeConnectionId,
    isLoading,
    error,
    isInitialized,

    // Connection actions
    fetchConnections,
    fetchConnection,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    setActiveConnection,
    initialize,
    clearError,

    // Helper methods
    hasActiveConnection: !!activeConnection,
    getConnectionPlatform: (id: number) => {
      const conn = connections.find((c: Connection) => c.id === id);
      return conn ? conn.platform : null;
    },
    getConnectionName: (id: number) => {
      const conn = connections.find((c: Connection) => c.id === id);
      return conn ? conn.connection_name : 'Unknown Connection';
    },
  };
}

export default useConnections;
