'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useAssetTechnologyPlatformStore } from '@/modules/nexotype/store/commercial/asset-technology-platform.store';
import { type AssetTechnologyPlatform } from '@/modules/nexotype/schemas/commercial/asset-technology-platform.schemas';

/**
 * Context type for the asset technology platforms provider
 */
export interface AssetTechnologyPlatformContextType {
  // State
  assetTechnologyPlatforms: AssetTechnologyPlatform[];
  activeAssetTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveAssetTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const AssetTechnologyPlatformContext = createContext<AssetTechnologyPlatformContextType | null>(null);

/**
 * Provider component for asset technology platform-related state and actions
 */
export function AssetTechnologyPlatformProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    assetTechnologyPlatforms,
    activeAssetTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetTechnologyPlatform,
    clearError,
  } = useAssetTechnologyPlatformStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAssetTechnologyPlatformStore.persist.rehydrate();
  }, []);

  // Initialize asset technology platforms on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing asset technology platforms:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AssetTechnologyPlatformContextType>(() => ({
    assetTechnologyPlatforms,
    activeAssetTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetTechnologyPlatform,
    clearError,
  }), [
    assetTechnologyPlatforms,
    activeAssetTechnologyPlatformId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveAssetTechnologyPlatform,
    clearError,
  ]);

  return (
    <AssetTechnologyPlatformContext.Provider value={contextValue}>
      {children}
    </AssetTechnologyPlatformContext.Provider>
  );
}

/**
 * Default export
 */
export default AssetTechnologyPlatformProvider;
