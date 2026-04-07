'use client';

/**
 * Stakeholder Position Provider
 *
 * Provider component for computed stakeholder position state.
 * Read-only — no CRUD operations, no initial fetch (fetched on demand by source_entity_id).
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/stakeholder_position_service.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */

import React, { createContext, useMemo } from 'react';
import { useStakeholderPositionStore } from '../../store/captable/stakeholder-position.store';
import { type StakeholderPositionSummary, type TrackAsHoldingResponse } from '../../schemas/captable/stakeholder-position.schemas';

/**
 * Context type for the stakeholder position provider
 */
export interface StakeholderPositionContextType {
  // State
  positions: StakeholderPositionSummary[];
  activePosition: StakeholderPositionSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPositions: (sourceEntityId: number) => Promise<boolean>;
  fetchPosition: (entityId: number, sourceEntityId: number) => Promise<boolean>;
  trackAsHolding: (entityId: number, sourceEntityId: number) => Promise<TrackAsHoldingResponse>;
  clearError: () => void;
  reset: () => void;
}

// Create the context
export const StakeholderPositionContext = createContext<StakeholderPositionContextType | null>(null);

/**
 * Provider component for computed stakeholder position state and actions
 * No initialFetch — data is fetched on demand when an entity is selected
 */
export function StakeholderPositionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get state and actions from the store
  const {
    positions,
    activePosition,
    isLoading,
    error,
    fetchPositions,
    fetchPosition,
    trackAsHolding,
    clearError,
    reset,
  } = useStakeholderPositionStore();

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<StakeholderPositionContextType>(() => ({
    positions,
    activePosition,
    isLoading,
    error,
    fetchPositions,
    fetchPosition,
    trackAsHolding,
    clearError,
    reset,
  }), [
    positions,
    activePosition,
    isLoading,
    error,
    fetchPositions,
    fetchPosition,
    trackAsHolding,
    clearError,
    reset,
  ]);

  return (
    <StakeholderPositionContext.Provider value={contextValue}>
      {children}
    </StakeholderPositionContext.Provider>
  );
}

/**
 * Default export
 */
export default StakeholderPositionProvider;
