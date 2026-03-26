'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ConnectionStats } from '../schemas/data.schemas';
import { getConnectionStats } from '../service/data.service';

/**
 * Analytics store state interface
 */
export interface AnalyticsState {
  // State
  connectionStats: ConnectionStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConnectionStats: (connectionId: number) => Promise<ConnectionStats | null>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create analytics store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 * No persistence needed — stats are fetched fresh each time
 */
export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    immer((set) => ({
      // Initial state
      connectionStats: null,
      isLoading: false,
      error: null,

      /**
       * Fetch connection statistics
       * @param connectionId Connection ID
       * @returns Promise with connection stats or null
       */
      fetchConnectionStats: async (connectionId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getConnectionStats(connectionId);

          if (response.success && response.data) {
            set({
              connectionStats: response.data,
              isLoading: false,
            });
            return response.data;
          } else {
            set({
              connectionStats: null,
              isLoading: false,
              error: response.error || `Failed to fetch stats for connection ${connectionId}`,
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return null;
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset analytics state to initial values
       */
      reset: () => {
        set({
          connectionStats: null,
          isLoading: false,
          error: null,
        });
      },
    }))
  )
);
