'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PermissionsData } from '@/modules/nexotype/schemas/shared/permissions.schemas';
import { getPermissions } from '@/modules/nexotype/service/shared/permissions.service';

/**
 * Permissions store state interface
 */
export interface PermissionsState {
  // State
  permissions: PermissionsData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create permissions store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 *
 * No persist middleware — permissions are session-based,
 * re-fetched on every mount from the backend (single source of truth).
 */
export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    immer((set) => ({
      // Initial state
      permissions: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize permissions state by fetching from backend
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getPermissions();

          if (response.success && response.data) {
            set((state) => {
              state.permissions = response.data || null;
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize permissions',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize permissions',
          });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset state to initial values
       */
      reset: () => {
        set({
          permissions: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    }))
  )
);
