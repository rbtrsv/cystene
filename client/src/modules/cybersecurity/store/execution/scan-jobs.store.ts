'use client';

/**
 * Scan Job Store
 *
 * Zustand store for ScanJob model.
 * No create/update — jobs are created via startScan and are immutable once started.
 * Includes startScan and cancelScan actions.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_job_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ScanJob,
} from '../../schemas/execution/scan-jobs.schemas';
import {
  getScanJobs,
  getScanJob,
  startScan as apiStartScan,
  cancelScan as apiCancelScan,
  ListScanJobsParams,
} from '../../service/execution/scan-jobs.service';

/**
 * Scan job store state interface
 */
export interface ScanJobState {
  // State
  scanJobs: ScanJob[];
  activeScanJobId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchScanJobs: (params?: ListScanJobsParams) => Promise<boolean>;
  fetchScanJob: (id: number) => Promise<ScanJob | null>;
  startScan: (targetId: number, templateId: number) => Promise<boolean>;
  cancelScan: (id: number) => Promise<boolean>;
  setActiveScanJob: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create scan job store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useScanJobStore = create<ScanJobState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      scanJobs: [],
      activeScanJobId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize scan jobs state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanJobs();

          if (response.success && response.data) {
            set((state) => {
              state.scanJobs = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize scan jobs'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize scan jobs'
          });
        }
      },

      /**
       * Fetch all scan jobs with optional filters
       * @param params Optional query parameters for filtering
       * @returns Success status
       */
      fetchScanJobs: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanJobs(params);

          if (response.success && response.data) {
            set((state) => {
              state.scanJobs = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch scan jobs'
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
       * Fetch a specific scan job by ID
       * @param id Scan job ID
       * @returns Promise with scan job or null
       */
      fetchScanJob: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getScanJob(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch scan job with ID ${id}`
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
       * Start a new scan — creates ScanJob and launches scanner dispatcher
       * @param targetId Scan target ID
       * @param templateId Scan template ID
       * @returns Success status
       */
      startScan: async (targetId, templateId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiStartScan(targetId, templateId);

          if (response.success && response.data) {
            // After starting, refresh scan jobs list to include the new pending job
            await get().fetchScanJobs();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to start scan'
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
       * Cancel a running or pending scan job
       * @param id Scan job ID
       * @returns Success status
       */
      cancelScan: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCancelScan(id);

          if (response.success) {
            // After cancelling, refresh scan jobs list
            await get().fetchScanJobs();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to cancel scan job with ID ${id}`
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
       * Set active scan job
       * @param id ID of the active scan job or null
       */
      setActiveScanJob: (id) => {
        set((state) => {
          state.activeScanJobId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset scan job state to initial values
       */
      reset: () => {
        set({
          scanJobs: [],
          activeScanJobId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-scan-job-storage',
        partialize: (state) => ({
          activeScanJobId: state.activeScanJobId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get scan job by ID from store
 * @param id Scan job ID
 * @returns The scan job or undefined if not found
 */
export const getScanJobById = (id: number): ScanJob | undefined => {
  const { scanJobs } = useScanJobStore.getState();
  return scanJobs.find((item) => item.id === id);
};

/**
 * Get active scan job from store
 * @returns The active scan job or undefined if not set
 */
export const getActiveScanJob = (): ScanJob | undefined => {
  const { scanJobs, activeScanJobId } = useScanJobStore.getState();
  return scanJobs.find((item) => item.id === activeScanJobId);
};
