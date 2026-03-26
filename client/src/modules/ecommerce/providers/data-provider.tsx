'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAnalyticsStore } from '../store/data.store';
import { useConnectionStore } from '../store/ecommerce-connections.store';
import { type ConnectionStats } from '../schemas/data.schemas';

/**
 * Context type for the analytics provider
 */
export interface AnalyticsContextType {
  // State
  connectionStats: ConnectionStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  clearError: () => void;
}

// Create the context
export const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

/**
 * Provider component for analytics-related state and actions
 *
 * Auto-fetches stats when activeConnectionId changes
 */
export function AnalyticsProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    connectionStats,
    isLoading,
    error,
    fetchConnectionStats,
    clearError,
  } = useAnalyticsStore();

  // Get active connection from connection store
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);

  // Stats are fetched explicitly by pages that need them (e.g. connection detail page)
  // Not auto-fetched here to avoid 404 errors for connections without data yet

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AnalyticsContextType>(
    () => ({
      connectionStats,
      isLoading,
      error,
      clearError,
    }),
    [connectionStats, isLoading, error, clearError]
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Default export
 */
export default AnalyticsProvider;
