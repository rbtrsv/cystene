'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePermissionsStore } from '@/modules/nexotype/store/shared/permissions.store';
import { type PermissionsData } from '@/modules/nexotype/schemas/shared/permissions.schemas';

/**
 * Context type for the permissions provider
 */
export interface PermissionsContextType {
  // State
  permissions: PermissionsData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  clearError: () => void;
}

// Create the context
export const PermissionsContext = createContext<PermissionsContextType | null>(null);

/**
 * Provider component for permissions state and actions
 *
 * Wraps all nexotype providers — must be the outermost provider so that
 * domain providers can check permissions before initializing.
 */
export function PermissionsProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    permissions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError,
  } = usePermissionsStore();

  // Initialize permissions on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing permissions:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PermissionsContextType>(() => ({
    permissions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError,
  }), [
    permissions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError,
  ]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Default export
 */
export default PermissionsProvider;
