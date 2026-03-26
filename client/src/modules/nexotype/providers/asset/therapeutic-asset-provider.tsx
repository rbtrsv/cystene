'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useTherapeuticAssetStore } from '@/modules/nexotype/store/asset/therapeutic-asset.store';
import { type TherapeuticAsset } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';

/**
 * Context type for the therapeutic assets provider
 */
export interface TherapeuticAssetContextType {
  // State
  therapeuticAssets: TherapeuticAsset[];
  activeTherapeuticAssetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTherapeuticAsset: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const TherapeuticAssetContext = createContext<TherapeuticAssetContextType | null>(null);

/**
 * Provider component for therapeutic asset-related state and actions
 */
export function TherapeuticAssetProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    therapeuticAssets,
    activeTherapeuticAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticAsset,
    clearError,
  } = useTherapeuticAssetStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useTherapeuticAssetStore.persist.rehydrate();
  }, []);

  // Initialize therapeutic assets on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing therapeutic assets:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TherapeuticAssetContextType>(() => ({
    therapeuticAssets,
    activeTherapeuticAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticAsset,
    clearError,
  }), [
    therapeuticAssets,
    activeTherapeuticAssetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveTherapeuticAsset,
    clearError,
  ]);

  return (
    <TherapeuticAssetContext.Provider value={contextValue}>
      {children}
    </TherapeuticAssetContext.Provider>
  );
}

/**
 * Default export
 */
export default TherapeuticAssetProvider;
