'use client';

/**
 * Stakeholder Position Store
 *
 * Zustand store for computed stakeholder position data (read-only).
 * No CRUD operations — fetches computed positions by source_entity_id.
 * No persist middleware — computed data should always be fresh.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/stakeholder_position_service.py
 * - Router: /server/apps/assetmanager/subrouters/captable_subrouters/stakeholder_position_subrouter.py
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StakeholderPositionSummary, TrackAsHoldingResponse } from '../../schemas/captable/stakeholder-position.schemas';
import {
  getStakeholderPositions,
  getStakeholderPosition,
  trackAsHolding as trackAsHoldingService,
} from '../../service/captable/stakeholder-position.service';

/**
 * Stakeholder Position store state interface
 */
export interface StakeholderPositionState {
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

/**
 * Create stakeholder position store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 * No persist — computed data should always be fetched fresh
 */
export const useStakeholderPositionStore = create<StakeholderPositionState>()(
  devtools(
    immer((set) => ({
      // Initial state
      positions: [],
      activePosition: null,
      isLoading: false,
      error: null,

      /**
       * Fetch all positions for a source entity (investor view)
       * @param sourceEntityId Source entity ID (the investing entity)
       * @returns Success status
       */
      fetchPositions: async (sourceEntityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholderPositions(sourceEntityId);

          if (response.success && response.data) {
            set((state) => {
              state.positions = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch stakeholder positions',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Fetch position detail for a source entity on a specific cap table
       * @param entityId Entity ID of the cap table
       * @param sourceEntityId Source entity ID (the investing entity)
       * @returns Success status
       */
      fetchPosition: async (entityId, sourceEntityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholderPosition(entityId, sourceEntityId);

          if (response.success && response.data) {
            set((state) => {
              state.activePosition = response.data || null;
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch stakeholder position',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Track a position as a Holding (creates Holding + HoldingCashFlows from cap table data)
       * @param entityId Entity ID of the cap table (target entity)
       * @param sourceEntityId Source entity ID (the investing entity)
       * @returns TrackAsHoldingResponse
       */
      trackAsHolding: async (entityId, sourceEntityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await trackAsHoldingService(entityId, sourceEntityId);

          set({ isLoading: false });

          if (!response.success) {
            set({ error: response.error || 'Failed to track as holding' });
          }

          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          };
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset stakeholder position state to initial values
       */
      reset: () => {
        set({
          positions: [],
          activePosition: null,
          isLoading: false,
          error: null,
        });
      },
    }))
  )
);
