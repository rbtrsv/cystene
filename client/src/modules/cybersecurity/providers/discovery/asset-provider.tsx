'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssetStore } from '../../store/discovery/assets.store';
import { type Asset } from '../../schemas/discovery/assets.schemas';

/**
 * Context type for the assets provider
 */
export interface AssetContextType {
  // State
  assets: Asset[];
  activeAssetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAsset: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssetContext = createContext<AssetContextType | null>(null);

/**
 * Provider component for asset-related state and actions
 */
export function AssetProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assets,
    activeAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAsset,
    clearError
  } = useAssetStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssetStore.persist.rehydrate();
  }, []);

  // Initialize assets on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing assets:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssetContextType>(() => ({
    assets,
    activeAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAsset,
    clearError
  }), [
    assets,
    activeAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAsset,
    clearError
  ]);

  return (
    <AssetContext.Provider value={contextValue}>
      {children}
    </AssetContext.Provider>
  );
}

/**
 * Default export
 */
export default AssetProvider;
