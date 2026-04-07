'use client';

/**
 * Scan Schedule Store
 *
 * Zustand store for ScanSchedule model.
 * Includes activate/deactivate actions for toggling schedules.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_schedule_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ScanSchedule,
  CreateScanSchedule,
  UpdateScanSchedule,
} from '../../schemas/execution/scan-schedules.schemas';
import {
  getScanSchedules,
  getScanSchedule,
  createScanSchedule as apiCreateScanSchedule,
  updateScanSchedule as apiUpdateScanSchedule,
  deleteScanSchedule as apiDeleteScanSchedule,
  activateScanSchedule as apiActivateScanSchedule,
  deactivateScanSchedule as apiDeactivateScanSchedule,
  ListScanSchedulesParams,
} from '../../service/execution/scan-schedules.service';

/**
 * Scan schedule store state interface
 */
export interface ScanScheduleState {
  // State
  scanSchedules: ScanSchedule[];
  activeScanScheduleId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchScanSchedules: (params?: ListScanSchedulesParams) => Promise<boolean>;
  fetchScanSchedule: (id: number) => Promise<ScanSchedule | null>;
  createScanSchedule: (data: CreateScanSchedule) => Promise<boolean>;
  updateScanSchedule: (id: number, data: UpdateScanSchedule) => Promise<boolean>;
  deleteScanSchedule: (id: number) => Promise<boolean>;
  activateScanSchedule: (id: number) => Promise<boolean>;
  deactivateScanSchedule: (id: number) => Promise<boolean>;
  setActiveScanSchedule: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create scan schedule store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useScanScheduleStore = create<ScanScheduleState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      scanSchedules: [],
      activeScanScheduleId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize scan schedules state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanSchedules();

          if (response.success && response.data) {
            set((state) => {
              state.scanSchedules = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize scan schedules'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize scan schedules'
          });
        }
      },

      /**
       * Fetch all scan schedules with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchScanSchedules: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanSchedules(params);

          if (response.success && response.data) {
            set((state) => {
              state.scanSchedules = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch scan schedules'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Fetch a specific scan schedule by ID
       * @param id Scan schedule ID
       * @returns Promise with scan schedule or null
       */
      fetchScanSchedule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanSchedule(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch scan schedule with ID ${id}`
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },

      /**
       * Create a new scan schedule
       * @param data Scan schedule creation data
       * @returns Success status
       */
      createScanSchedule: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateScanSchedule(data);

          if (response.success && response.data) {
            // After creating, refresh scan schedules list
            await get().fetchScanSchedules();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create scan schedule'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Update an existing scan schedule
       * @param id Scan schedule ID
       * @param data Scan schedule update data
       * @returns Success status
       */
      updateScanSchedule: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateScanSchedule(id, data);

          if (response.success && response.data) {
            // After updating, refresh scan schedules list
            await get().fetchScanSchedules();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update scan schedule with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Delete a scan schedule
       * @param id Scan schedule ID
       * @returns Success status
       */
      deleteScanSchedule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteScanSchedule(id);

          if (response.success) {
            // After deleting, refresh scan schedules list
            await get().fetchScanSchedules();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete scan schedule with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Activate a scan schedule
       * @param id Scan schedule ID
       * @returns Success status
       */
      activateScanSchedule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiActivateScanSchedule(id);

          if (response.success) {
            // After activating, refresh scan schedules list
            await get().fetchScanSchedules();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to activate scan schedule with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Deactivate a scan schedule
       * @param id Scan schedule ID
       * @returns Success status
       */
      deactivateScanSchedule: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeactivateScanSchedule(id);

          if (response.success) {
            // After deactivating, refresh scan schedules list
            await get().fetchScanSchedules();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to deactivate scan schedule with ID ${id}`
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return false;
        }
      },

      /**
       * Set active scan schedule
       * @param id ID of the active scan schedule or null
       */
      setActiveScanSchedule: (id) => {
        set((state) => {
          state.activeScanScheduleId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset scan schedule state to initial values
       */
      reset: () => {
        set({
          scanSchedules: [],
          activeScanScheduleId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-scan-schedule-storage',
        partialize: (state) => ({
          activeScanScheduleId: state.activeScanScheduleId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get scan schedule by ID from store
 * @param id Scan schedule ID
 * @returns The scan schedule or undefined if not found
 */
export const getScanScheduleById = (id: number): ScanSchedule | undefined => {
  const { scanSchedules } = useScanScheduleStore.getState();
  return scanSchedules.find((item) => item.id === id);
};

/**
 * Get active scan schedule from store
 * @returns The active scan schedule or undefined if not set
 */
export const getActiveScanSchedule = (): ScanSchedule | undefined => {
  const { scanSchedules, activeScanScheduleId } = useScanScheduleStore.getState();
  return scanSchedules.find((item) => item.id === activeScanScheduleId);
};
