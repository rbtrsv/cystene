'use client';

import { useContext } from 'react';
import { SettingsContext, SettingsContextType } from '../providers/recommendation-settings-provider';
import { useSettingsStore } from '../store/recommendation-settings.store';

/**
 * Hook to use the settings context
 * @throws Error if used outside of a SettingsProvider
 */
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }

  return context;
}

/**
 * Custom hook that combines settings context and store
 * to provide a simplified interface for settings functionality
 *
 * @returns Settings utilities and state
 */
export function useSettings() {
  // Get data from settings context
  const {
    allSettings,
    currentSettings,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError,
  } = useSettingsContext();

  // Get additional actions from settings store
  const {
    fetchAllSettings,
    fetchSettings,
    createOrUpdateSettings,
    deleteSettings,
    resetSettings,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useSettingsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    allSettings,
    currentSettings,
    isLoading,
    error,
    isInitialized,

    // Settings actions
    fetchAllSettings,
    fetchSettings,
    createOrUpdateSettings,
    deleteSettings,
    resetSettings,
    initialize,
    clearError,

    // Helper methods
    hasSettings: !!currentSettings,
    getSettingsForConnection: (connectionId: number) => {
      const entry = allSettings.find((s) => s.connection_id === connectionId);
      return entry?.settings ?? null;
    },
  };
}

export default useSettings;
