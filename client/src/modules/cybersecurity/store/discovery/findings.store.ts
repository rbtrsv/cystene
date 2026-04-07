'use client';

/**
 * Finding Store
 *
 * Zustand store for Finding model.
 * No create/delete — scanner writes findings. User only updates triage status.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/finding_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Finding,
  FindingStatus,
} from '../../schemas/discovery/findings.schemas';
import {
  getFindings,
  getFinding,
  updateFindingStatus as apiUpdateFindingStatus,
  ListFindingsParams,
} from '../../service/discovery/findings.service';

/**
 * Finding store state interface
 */
export interface FindingState {
  // State
  findings: Finding[];
  activeFindingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchFindings: (params?: ListFindingsParams) => Promise<boolean>;
  fetchFinding: (id: number) => Promise<Finding | null>;
  updateFindingStatus: (id: number, status: FindingStatus) => Promise<boolean>;
  setActiveFinding: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create finding store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useFindingStore = create<FindingState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      findings: [],
      activeFindingId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize findings state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFindings();

          if (response.success && response.data) {
            set((state) => {
              state.findings = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize findings'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize findings'
          });
        }
      },

      /**
       * Fetch all findings with optional filters
       * @param params Optional query parameters for filtering (severity, category, status, scan_job_id)
       * @returns Success status
       */
      fetchFindings: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFindings(params);

          if (response.success && response.data) {
            set((state) => {
              state.findings = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch findings'
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
       * Fetch a specific finding by ID
       * @param id Finding ID
       * @returns Promise with finding or null
       */
      fetchFinding: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getFinding(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch finding with ID ${id}`
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
       * Update finding triage status
       * @param id Finding ID
       * @param status New triage status (open, acknowledged, resolved, false_positive)
       * @returns Success status
       */
      updateFindingStatus: async (id, status) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateFindingStatus(id, { status });

          if (response.success) {
            // After updating status, refresh findings list
            await get().fetchFindings();

            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to update finding status for ID ${id}`
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
       * Set active finding
       * @param id ID of the active finding or null
       */
      setActiveFinding: (id) => {
        set((state) => {
          state.activeFindingId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset finding state to initial values
       */
      reset: () => {
        set({
          findings: [],
          activeFindingId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-finding-storage',
        partialize: (state) => ({
          activeFindingId: state.activeFindingId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get finding by ID from store
 * @param id Finding ID
 * @returns The finding or undefined if not found
 */
export const getFindingById = (id: number): Finding | undefined => {
  const { findings } = useFindingStore.getState();
  return findings.find((item) => item.id === id);
};

/**
 * Get active finding from store
 * @returns The active finding or undefined if not set
 */
export const getActiveFinding = (): Finding | undefined => {
  const { findings, activeFindingId } = useFindingStore.getState();
  return findings.find((item) => item.id === activeFindingId);
};
