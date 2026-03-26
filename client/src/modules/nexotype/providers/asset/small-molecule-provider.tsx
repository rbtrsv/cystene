'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSmallMoleculeStore } from '@/modules/nexotype/store/asset/small-molecule.store';
import { type SmallMolecule } from '@/modules/nexotype/schemas/asset/small-molecule.schemas';

/**
 * Context type for the small molecules provider
 */
export interface SmallMoleculeContextType {
  // State
  smallMolecules: SmallMolecule[];
  activeSmallMoleculeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveSmallMolecule: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SmallMoleculeContext = createContext<SmallMoleculeContextType | null>(null);

/**
 * Provider component for small molecule-related state and actions
 */
export function SmallMoleculeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    smallMolecules,
    activeSmallMoleculeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSmallMolecule,
    clearError,
  } = useSmallMoleculeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSmallMoleculeStore.persist.rehydrate();
  }, []);

  // Initialize small molecules on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing small molecules:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SmallMoleculeContextType>(() => ({
    smallMolecules,
    activeSmallMoleculeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSmallMolecule,
    clearError,
  }), [
    smallMolecules,
    activeSmallMoleculeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSmallMolecule,
    clearError,
  ]);

  return (
    <SmallMoleculeContext.Provider value={contextValue}>
      {children}
    </SmallMoleculeContext.Provider>
  );
}

/**
 * Default export
 */
export default SmallMoleculeProvider;
