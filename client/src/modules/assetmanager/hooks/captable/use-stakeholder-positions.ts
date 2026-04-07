'use client';

/**
 * Stakeholder Position Hooks
 *
 * React hooks for computed stakeholder position data (read-only).
 * Combines context and store for a simplified interface.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/stakeholder_position_service.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */

import { useContext } from 'react';
import { StakeholderPositionContext, StakeholderPositionContextType } from '../../providers/captable/stakeholder-position-provider';

/**
 * Hook to use the stakeholder position context
 * @throws Error if used outside of the provider
 */
export function useStakeholderPositionContext(): StakeholderPositionContextType {
  const context = useContext(StakeholderPositionContext);

  if (!context) {
    throw new Error('useStakeholderPositionContext must be used within a StakeholderPositionProvider');
  }

  return context;
}

/**
 * Custom hook that provides stakeholder position functionality
 *
 * @returns Stakeholder position utilities and state
 */
export function useStakeholderPositions() {
  // Get data from stakeholder position context
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
  } = useStakeholderPositionContext();

  return {
    // State
    positions,
    activePosition,
    isLoading,
    error,

    // Actions
    fetchPositions,
    fetchPosition,
    trackAsHolding,
    clearError,
    reset,

    // Helper methods
    getPositionByEntityId: (entityId: number) => {
      return positions.find((item) => item.entity_id === entityId);
    },
  };
}

export default useStakeholderPositions;
