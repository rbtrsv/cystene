'use client';

/**
 * Scan Target Store
 *
 * Zustand store for ScanTarget model.
 * Includes verify action for target ownership verification.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/scan_target_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ScanTarget,
  CreateScanTarget,
  UpdateScanTarget,
} from '../../schemas/infrastructure/scan-targets.schemas';
import {
  getScanTargets,
  getScanTarget,
  createScanTarget as apiCreateScanTarget,
  updateScanTarget as apiUpdateScanTarget,
  deleteScanTarget as apiDeleteScanTarget,
  verifyScanTarget as apiVerifyScanTarget,
  ListScanTargetsParams,
} from '../../service/infrastructure/scan-targets.service';

/**
 * Scan target store state interface
 */
export interface ScanTargetState {
  // State
  scanTargets: ScanTarget[];
  activeScanTargetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchScanTargets: (params?: ListScanTargetsParams) => Promise<boolean>;
  fetchScanTarget: (id: number) => Promise<ScanTarget | null>;
  createScanTarget: (data: CreateScanTarget) => Promise<boolean>;
  updateScanTarget: (id: number, data: UpdateScanTarget) => Promise<boolean>;
  deleteScanTarget: (id: number) => Promise<boolean>;
  verifyScanTarget: (id: number) => Promise<boolean>;
  setActiveScanTarget: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create scan target store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useScanTargetStore = create<ScanTargetState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      scanTargets: [],
      activeScanTargetId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize scan targets state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTargets();

          if (response.success && response.data) {
            set((state) => {
              state.scanTargets = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;

              // Set active scan target if not already set and scan targets exist
              if (response.data && response.data.length > 0 && state.activeScanTargetId === null) {
                state.activeScanTargetId = response.data[0].id;
              }
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize scan targets'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize scan targets'
          });
        }
      },

      /**
       * Fetch all scan targets with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchScanTargets: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTargets(params);

          if (response.success && response.data) {
            set((state) => {
              state.scanTargets = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch scan targets'
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
       * Fetch a specific scan target by ID
       * @param id Scan target ID
       * @returns Promise with scan target or null
       */
      fetchScanTarget: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanTarget(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch scan target with ID ${id}`
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
       * Create a new scan target
       * @param data Scan target creation data
       * @returns Success status
       */
      createScanTarget: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateScanTarget(data);

          if (response.success && response.data) {
            // After creating, refresh scan targets list
            await get().fetchScanTargets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to create scan target'
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
       * Update an existing scan target
       * @param id Scan target ID
       * @param data Scan target update data
       * @returns Success status
       */
      updateScanTarget: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateScanTarget(id, data);

          if (response.success && response.data) {
            // After updating, refresh scan targets list
            await get().fetchScanTargets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update scan target with ID ${id}`
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
       * Delete a scan target
       * @param id Scan target ID
       * @returns Success status
       */
      deleteScanTarget: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteScanTarget(id);

          if (response.success) {
            // After deleting, refresh scan targets list
            await get().fetchScanTargets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete scan target with ID ${id}`
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
       * Verify ownership of a scan target
       * @param id Scan target ID
       * @returns Success status
       */
      verifyScanTarget: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiVerifyScanTarget(id);

          if (response.success) {
            // After verifying, refresh scan targets list
            await get().fetchScanTargets();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to verify scan target with ID ${id}`
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
       * Set active scan target
       * @param id ID of the active scan target or null
       */
      setActiveScanTarget: (id) => {
        set((state) => {
          state.activeScanTargetId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset scan target state to initial values
       */
      reset: () => {
        set({
          scanTargets: [],
          activeScanTargetId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-scan-target-storage',
        partialize: (state) => ({
          activeScanTargetId: state.activeScanTargetId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get scan target by ID from store
 * @param id Scan target ID
 * @returns The scan target or undefined if not found
 */
export const getScanTargetById = (id: number): ScanTarget | undefined => {
  const { scanTargets } = useScanTargetStore.getState();
  return scanTargets.find((item) => item.id === id);
};

/**
 * Get active scan target from store
 * @returns The active scan target or undefined if not set
 */
export const getActiveScanTarget = (): ScanTarget | undefined => {
  const { scanTargets, activeScanTargetId } = useScanTargetStore.getState();
  return scanTargets.find((item) => item.id === activeScanTargetId);
};
