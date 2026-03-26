'use client';

/**
 * Performance Computed Store
 *
 * Zustand store for computed performance data (read-only).
 * No CRUD operations — fetches computed metrics by entity_id.
 * No persist middleware — computed data should always be fresh.
 *
 * Backend sources:
 * - Service: /server/apps/assetmanager/services/performance_service.py
 * - Router: /server/apps/assetmanager/subrouters/holding_subrouters/performance_subrouter.py
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EntityPerformance,
  HoldingPerformanceComputed,
  StakeholderReturn,
} from '../../schemas/holding/performance-computed.schemas';
import {
  getEntityPerformance,
  getHoldingsPerformance,
  getStakeholderReturns,
} from '../../service/holding/performance-computed.service';

/**
 * Performance Computed store state interface
 */
export interface PerformanceComputedState {
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

/**
 * Create performance computed store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 * No persist — computed data should always be fetched fresh
 */
export const usePerformanceComputedStore = create<PerformanceComputedState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      entityPerformance: null,
      holdingsPerformance: [],
      stakeholderReturns: [],
      isLoading: false,
      error: null,

      /**
       * Fetch entity/fund performance metrics
       * @param entityId Entity ID
       * @returns Success status
       */
      fetchEntityPerformance: async (entityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getEntityPerformance(entityId);

          if (response.success && response.data) {
            set((state) => {
              state.entityPerformance = response.data || null;
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch entity performance',
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
       * Fetch per-holding performance metrics
       * @param entityId Entity ID
       * @returns Success status
       */
      fetchHoldingsPerformance: async (entityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getHoldingsPerformance(entityId);

          if (response.success && response.data) {
            set((state) => {
              state.holdingsPerformance = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch holdings performance',
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
       * Fetch per-stakeholder return metrics
       * @param entityId Entity ID
       * @returns Success status
       */
      fetchStakeholderReturns: async (entityId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getStakeholderReturns(entityId);

          if (response.success && response.data) {
            set((state) => {
              state.stakeholderReturns = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch stakeholder returns',
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
       * Fetch all three performance datasets for an entity
       * @param entityId Entity ID
       * @returns Success status (true if all three succeed)
       */
      fetchAll: async (entityId) => {
        set({ isLoading: true, error: null });

        try {
          const [entityRes, holdingsRes, stakeholderRes] = await Promise.all([
            getEntityPerformance(entityId),
            getHoldingsPerformance(entityId),
            getStakeholderReturns(entityId),
          ]);

          set((state) => {
            state.entityPerformance = entityRes.success && entityRes.data ? entityRes.data : null;
            state.holdingsPerformance = holdingsRes.success && holdingsRes.data ? holdingsRes.data : [];
            state.stakeholderReturns = stakeholderRes.success && stakeholderRes.data ? stakeholderRes.data : [];
            state.isLoading = false;
          });

          // Return true only if all three succeeded
          const allSuccess = entityRes.success && holdingsRes.success && stakeholderRes.success;
          if (!allSuccess) {
            const errors = [entityRes.error, holdingsRes.error, stakeholderRes.error].filter(Boolean).join('; ');
            set({ error: errors || 'Failed to fetch some performance data' });
          }
          return allSuccess;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset performance computed state to initial values
       */
      reset: () => {
        set({
          entityPerformance: null,
          holdingsPerformance: [],
          stakeholderReturns: [],
          isLoading: false,
          error: null,
        });
      },
    }))
  )
);
