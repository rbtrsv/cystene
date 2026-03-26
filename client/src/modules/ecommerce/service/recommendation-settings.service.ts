'use client';

import {
  RecommendationSettings,
  SettingsResponse,
  SettingsListResponse,
  ConnectionSettings,
  CreateOrUpdateSettings,
} from '../schemas/recommendation-settings.schemas';
import { SETTINGS_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Get recommendation settings for a specific connection
 * @param connectionId Connection ID
 * @returns Promise with settings response
 */
export const getSettings = async (connectionId: number): Promise<SettingsResponse> => {
  try {
    // Backend returns { success, data: RecommendationSettings } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationSettings; error?: string }>(
      SETTINGS_ENDPOINTS.DETAIL(connectionId),
      { method: 'GET' }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch settings for connection ${connectionId}`,
      data: undefined,
    };
  }
};

/**
 * Get all connection settings for the current user
 * @returns Promise with settings list response
 */
export const getAllSettings = async (): Promise<SettingsListResponse> => {
  try {
    // Backend returns { success, data: ConnectionSettings[], count } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: ConnectionSettings[]; count: number; error?: string }>(
      SETTINGS_ENDPOINTS.LIST,
      { method: 'GET' }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch all settings',
      data: [],
    };
  }
};

/**
 * Create or update recommendation settings for a connection
 * @param connectionId Connection ID
 * @param data Settings data
 * @returns Promise with settings response
 */
export const createOrUpdateSettings = async (
  connectionId: number,
  data: Partial<CreateOrUpdateSettings>
): Promise<SettingsResponse> => {

  try {
    // Backend returns { success, data: RecommendationSettings } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: RecommendationSettings; error?: string }>(
      SETTINGS_ENDPOINTS.CREATE_OR_UPDATE(connectionId),
      { method: 'POST', body: data as unknown as Record<string, unknown> }
    );

    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to save settings for connection ${connectionId}`,
      data: undefined,
    };
  }
};

/**
 * Delete settings for a connection
 * @param connectionId Connection ID
 * @returns Promise with message response
 */
export const deleteSettings = async (connectionId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ message: string }>(
      SETTINGS_ENDPOINTS.DELETE(connectionId),
      { method: 'DELETE' }
    );

    return {
      success: true,
      message: response.message,
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete settings for connection ${connectionId}`,
    };
  }
};

/**
 * Reset settings to defaults for a connection
 * @param connectionId Connection ID
 * @returns Promise with message response
 */
export const resetSettings = async (connectionId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ message: string }>(
      SETTINGS_ENDPOINTS.RESET(connectionId),
      { method: 'POST' }
    );

    return {
      success: true,
      message: response.message,
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to reset settings for connection ${connectionId}`,
    };
  }
};
