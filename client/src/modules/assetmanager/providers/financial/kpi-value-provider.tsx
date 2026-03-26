'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useKPIValueStore } from '../../store/financial/kpi-value.store';
import { type KPIValue } from '../../schemas/financial/kpi-value.schemas';

/**
 * Context type for the KPI value provider
 */
export interface KPIValueContextType {
  // State
  kpiValues: KPIValue[];
  activeKPIValueId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveKPIValue: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const KPIValueContext = createContext<KPIValueContextType | null>(null);

/**
 * Provider component for KPI value-related state and actions
 */
export function KPIValueProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    kpiValues,
    activeKPIValueId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPIValue,
    clearError,
  } = useKPIValueStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useKPIValueStore.persist.rehydrate();
  }, []);

  // Initialize KPI values on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing KPI values:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<KPIValueContextType>(() => ({
    kpiValues,
    activeKPIValueId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPIValue,
    clearError,
  }), [
    kpiValues,
    activeKPIValueId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPIValue,
    clearError,
  ]);

  return (
    <KPIValueContext.Provider value={contextValue}>
      {children}
    </KPIValueContext.Provider>
  );
}

/**
 * Default export
 */
export default KPIValueProvider;
