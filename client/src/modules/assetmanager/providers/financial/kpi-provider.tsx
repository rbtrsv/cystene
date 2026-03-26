'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useKPIStore } from '../../store/financial/kpi.store';
import { type KPI } from '../../schemas/financial/kpi.schemas';

/**
 * Context type for the KPI provider
 */
export interface KPIContextType {
  // State
  kpis: KPI[];
  activeKPIId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveKPI: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const KPIContext = createContext<KPIContextType | null>(null);

/**
 * Provider component for KPI-related state and actions
 */
export function KPIProvider({
  children,
  initialFetch = true,
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    kpis,
    activeKPIId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPI,
    clearError,
  } = useKPIStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useKPIStore.persist.rehydrate();
  }, []);

  // Initialize KPIs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing KPIs:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<KPIContextType>(() => ({
    kpis,
    activeKPIId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPI,
    clearError,
  }), [
    kpis,
    activeKPIId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveKPI,
    clearError,
  ]);

  return (
    <KPIContext.Provider value={contextValue}>
      {children}
    </KPIContext.Provider>
  );
}

/**
 * Default export
 */
export default KPIProvider;
