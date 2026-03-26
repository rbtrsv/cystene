'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useUnitOfMeasureStore } from '@/modules/nexotype/store/standardization/unit-of-measure.store';
import { type UnitOfMeasure } from '@/modules/nexotype/schemas/standardization/unit-of-measure.schemas';

/**
 * Context type for the unit of measures provider
 */
export interface UnitOfMeasureContextType {
  // State
  unitsOfMeasure: UnitOfMeasure[];
  activeUnitOfMeasureId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveUnitOfMeasure: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const UnitOfMeasureContext = createContext<UnitOfMeasureContextType | null>(null);

/**
 * Provider component for unit of measure-related state and actions
 */
export function UnitOfMeasureProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    unitsOfMeasure,
    activeUnitOfMeasureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUnitOfMeasure,
    clearError,
  } = useUnitOfMeasureStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useUnitOfMeasureStore.persist.rehydrate();
  }, []);

  // Initialize units of measure on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing unit of measures:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UnitOfMeasureContextType>(() => ({
    unitsOfMeasure,
    activeUnitOfMeasureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUnitOfMeasure,
    clearError,
  }), [
    unitsOfMeasure,
    activeUnitOfMeasureId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUnitOfMeasure,
    clearError,
  ]);

  return (
    <UnitOfMeasureContext.Provider value={contextValue}>
      {children}
    </UnitOfMeasureContext.Provider>
  );
}

/**
 * Default export
 */
export default UnitOfMeasureProvider;
