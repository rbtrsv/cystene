'use client';

/**
 * Report Store
 *
 * Zustand store for Report model.
 * Includes generateReport action for creating new reports.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/report_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Report,
  CreateReport,
} from '../../schemas/discovery/reports.schemas';
import {
  getReports,
  getReport,
  generateReport as apiGenerateReport,
  deleteReport as apiDeleteReport,
  ListReportsParams,
} from '../../service/discovery/reports.service';

/**
 * Report store state interface
 */
export interface ReportState {
  // State
  reports: Report[];
  activeReportId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchReports: (params?: ListReportsParams) => Promise<boolean>;
  fetchReport: (id: number) => Promise<Report | null>;
  generateReport: (data: CreateReport) => Promise<boolean>;
  deleteReport: (id: number) => Promise<boolean>;
  setActiveReport: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create report store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useReportStore = create<ReportState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      reports: [],
      activeReportId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize reports state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getReports();

          if (response.success && response.data) {
            set((state) => {
              state.reports = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize reports'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize reports'
          });
        }
      },

      /**
       * Fetch all reports with optional filters
       * @param params Optional query parameters for filtering (target_id)
       * @returns Success status
       */
      fetchReports: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getReports(params);

          if (response.success && response.data) {
            set((state) => {
              state.reports = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch reports'
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
       * Fetch a specific report by ID
       * @param id Report ID
       * @returns Promise with report or null
       */
      fetchReport: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getReport(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch report with ID ${id}`
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
       * Generate a new report
       * @param data Report generation data (target_id, report_type, format)
       * @returns Success status
       */
      generateReport: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiGenerateReport(data);

          if (response.success && response.data) {
            // After generating, refresh reports list
            await get().fetchReports();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to generate report'
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
       * Delete a report
       * @param id Report ID
       * @returns Success status
       */
      deleteReport: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteReport(id);

          if (response.success) {
            // After deleting, refresh reports list
            await get().fetchReports();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete report with ID ${id}`
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
       * Set active report
       * @param id ID of the active report or null
       */
      setActiveReport: (id) => {
        set((state) => {
          state.activeReportId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset report state to initial values
       */
      reset: () => {
        set({
          reports: [],
          activeReportId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-report-storage',
        partialize: (state) => ({
          activeReportId: state.activeReportId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get report by ID from store
 * @param id Report ID
 * @returns The report or undefined if not found
 */
export const getReportById = (id: number): Report | undefined => {
  const { reports } = useReportStore.getState();
  return reports.find((item) => item.id === id);
};

/**
 * Get active report from store
 * @returns The active report or undefined if not set
 */
export const getActiveReport = (): Report | undefined => {
  const { reports, activeReportId } = useReportStore.getState();
  return reports.find((item) => item.id === activeReportId);
};
