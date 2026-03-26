'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssetOwnershipStore } from '@/modules/nexotype/store/commercial/asset-ownership.store';
import { type AssetOwnership } from '@/modules/nexotype/schemas/commercial/asset-ownership.schemas';

/**
 * Context type for the asset ownerships provider
 */
export interface AssetOwnershipContextType {
  // State
  assetOwnerships: AssetOwnership[];
  activeAssetOwnershipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAssetOwnership: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssetOwnershipContext = createContext<AssetOwnershipContextType | null>(null);

/**
 * Provider component for asset ownership-related state and actions
 */
export function AssetOwnershipProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assetOwnerships,
    activeAssetOwnershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetOwnership,
    clearError,
  } = useAssetOwnershipStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssetOwnershipStore.persist.rehydrate();
  }, []);

  // Initialize asset ownerships on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing asset ownerships:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssetOwnershipContextType>(() => ({
    assetOwnerships,
    activeAssetOwnershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetOwnership,
    clearError,
  }), [
    assetOwnerships,
    activeAssetOwnershipId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetOwnership,
    clearError,
  ]);

  return (
    <AssetOwnershipContext.Provider value={contextValue}>
      {children}
    </AssetOwnershipContext.Provider>
  );
}

/**
 * Default export
 */
export default AssetOwnershipProvider;
