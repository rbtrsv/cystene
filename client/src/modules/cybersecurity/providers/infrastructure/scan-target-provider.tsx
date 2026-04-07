'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useScanTargetStore } from '../../store/infrastructure/scan-targets.store';
import { type ScanTarget } from '../../schemas/infrastructure/scan-targets.schemas';

/**
 * Context type for the scan targets provider
 */
export interface ScanTargetContextType {
  // State
  scanTargets: ScanTarget[];
  activeScanTargetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveScanTarget: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ScanTargetContext = createContext<ScanTargetContextType | null>(null);

/**
 * Provider component for scan target-related state and actions
 */
export function ScanTargetProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    scanTargets,
    activeScanTargetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTarget,
    clearError
  } = useScanTargetStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useScanTargetStore.persist.rehydrate();
  }, []);

  // Initialize scan targets on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing scan targets:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ScanTargetContextType>(() => ({
    scanTargets,
    activeScanTargetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTarget,
    clearError
  }), [
    scanTargets,
    activeScanTargetId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanTarget,
    clearError
  ]);

  return (
    <ScanTargetContext.Provider value={contextValue}>
      {children}
    </ScanTargetContext.Provider>
  );
}

/**
 * Default export
 */
export default ScanTargetProvider;
