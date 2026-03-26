'use client';

/**
 * Performance Computed Provider
 *
 * Provider component for computed performance state.
 * Read-only — no CRUD operations, no initial fetch (fetched on demand by entity_id).
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/performance_service.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */

import React, { createContext, useMemo } from 'react';
import { usePerformanceComputedStore } from '../../store/holding/performance-computed.store';
import {
  type EntityPerformance,
  type HoldingPerformanceComputed,
  type StakeholderReturn,
} from '../../schemas/holding/performance-computed.schemas';

/**
 * Context type for the performance computed provider
 */
export interface PerformanceComputedContextType {
  // State
  entityPerformance: EntityPerformance | null;
  holdingsPerformance: HoldingPerformanceComputed[];
  stakeholderReturns: StakeholderReturn[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEntityPerformance: (entityId: number) => Promise<boolean>;
  fetchHoldingsPerformance: (entityId: number) => Promise<boolean>;
  fetchStakeholderReturns: (entityId: number) => Promise<boolean>;
  fetchAll: (entityId: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// Create the context
export const PerformanceComputedContext = createContext<PerformanceComputedContextType | null>(null);

/**
 * Provider component for computed performance state and actions
 * No initialFetch — data is fetched on demand when an entity is selected
 */
export function PerformanceComputedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get state and actions from the store
  const {
    entityPerformance,
    holdingsPerformance,
    stakeholderReturns,
    isLoading,
    error,
    fetchEntityPerformance,
    fetchHoldingsPerformance,
    fetchStakeholderReturns,
    fetchAll,
    clearError,
    reset,
  } = usePerformanceComputedStore();

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PerformanceComputedContextType>(() => ({
    entityPerformance,
    holdingsPerformance,
    stakeholderReturns,
    isLoading,
    error,
    fetchEntityPerformance,
    fetchHoldingsPerformance,
    fetchStakeholderReturns,
    fetchAll,
    clearError,
    reset,
  }), [
    entityPerformance,
    holdingsPerformance,
    stakeholderReturns,
    isLoading,
    error,
    fetchEntityPerformance,
    fetchHoldingsPerformance,
    fetchStakeholderReturns,
    fetchAll,
    clearError,
    reset,
  ]);

  return (
    <PerformanceComputedContext.Provider value={contextValue}>
      {children}
    </PerformanceComputedContext.Provider>
  );
}

/**
 * Default export
 */
export default PerformanceComputedProvider;
