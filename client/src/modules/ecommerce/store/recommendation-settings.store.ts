'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  RecommendationSettings,
  ConnectionSettings,
  CreateOrUpdateSettings,
} from '../schemas/recommendation-settings.schemas';
import {
  getSettings,
  getAllSettings,
  createOrUpdateSettings as apiCreateOrUpdateSettings,
  deleteSettings as apiDeleteSettings,
  resetSettings as apiResetSettings,
} from '../service/recommendation-settings.service';

/**
 * Settings store state interface
 */
export interface SettingsState {
  // State
  allSettings: ConnectionSettings[];
  currentSettings: RecommendationSettings | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAllSettings: () => Promise<boolean>;
  fetchSettings: (connectionId: number) => Promise<RecommendationSettings | null>;
  createOrUpdateSettings: (connectionId: number, data: CreateOrUpdateSettings) => Promise<boolean>;
  deleteSettings: (connectionId: number) => Promise<boolean>;
  resetSettings: (connectionId: number) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create settings store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 * No persistence needed — settings are fetched fresh each session
 */
export const useSettingsStore = create<SettingsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      allSettings: [],
      currentSettings: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize settings state by fetching all connection settings
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getAllSettings();

          if (response.success && response.data) {
            set({
              allSettings: response.data,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize settings',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize settings',
          });
        }
      },

      /**
       * Fetch all connection settings
       * @returns Success status
       */
      fetchAllSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getAllSettings();

          if (response.success && response.data) {
            set({
              allSettings: response.data,
              isLoading: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch all settings',
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
       * Fetch settings for a specific connection
       * @param connectionId Connection ID
       * @returns Promise with settings or null
       */
      fetchSettings: async (connectionId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getSettings(connectionId);

          if (response.success && response.data) {
            set({
              currentSettings: response.data,
              isLoading: false,
            });
            return response.data;
          } else {
            set({
              currentSettings: null,
              isLoading: false,
              error: response.error || `Failed to fetch settings for connection ${connectionId}`,
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
       * Create or update settings for a connection
       * @param connectionId Connection ID
       * @param data Settings data
       * @returns Success status
       */
      createOrUpdateSettings: async (connectionId, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateOrUpdateSettings(connectionId, data);

          if (response.success && response.data) {
            set({ currentSettings: response.data, isLoading: false });

            // Refresh all settings list
            await get().fetchAllSettings();
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to save settings for connection ${connectionId}`,
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
       * Delete settings for a connection
       * @param connectionId Connection ID
       * @returns Success status
       */
      deleteSettings: async (connectionId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteSettings(connectionId);

          if (response.success) {
            set({ currentSettings: null, isLoading: false });

            // Refresh all settings list
            await get().fetchAllSettings();
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to delete settings for connection ${connectionId}`,
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
       * Reset settings to defaults for a connection
       * @param connectionId Connection ID
       * @returns Success status
       */
      resetSettings: async (connectionId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiResetSettings(connectionId);

          if (response.success) {
            // Re-fetch the settings to get the reset values
            await get().fetchSettings(connectionId);
            await get().fetchAllSettings();
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to reset settings for connection ${connectionId}`,
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
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset settings state to initial values
       */
      reset: () => {
        set({
          allSettings: [],
          currentSettings: null,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },
    }))
  )
);
