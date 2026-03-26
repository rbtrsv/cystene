'use client';

/**
 * Widget API Key Service
 *
 * CRUD operations for widget API key management.
 * Keys are used for HMAC-signed public widget URLs (non-Shopify platforms).
 *
 * Backend: /server/apps/ecommerce/subrouters/widget_api_key_subrouter.py
 */

import {
  WidgetAPIKeyCreatedResponse,
  WidgetAPIKeyListResponse,
  WidgetAPIKeyMessageResponse,
} from '../schemas/widget-api-keys.schemas';
import { WIDGET_API_KEY_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * List all widget API keys for a connection.
 * Returns keys with prefix only (no plaintext secret).
 * @param connectionId Connection ID
 * @returns Promise with list response
 */
export const getWidgetAPIKeys = async (connectionId: number): Promise<WidgetAPIKeyListResponse> => {
  try {
    const response = await fetchClient<WidgetAPIKeyListResponse>(
      WIDGET_API_KEY_ENDPOINTS.LIST(connectionId),
      { method: 'GET' }
    );

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch API keys',
    };
  }
};

/**
 * Generate a new widget API key for a connection.
 * Returns the plaintext secret ONCE (never retrievable again).
 * @param connectionId Connection ID
 * @param data Key creation payload (name, allowed_domains)
 * @returns Promise with created key response (includes plaintext secret)
 */
export const createWidgetAPIKey = async (
  connectionId: number,
  data: { name: string; allowed_domains?: string | null }
): Promise<WidgetAPIKeyCreatedResponse> => {
  try {
    const response = await fetchClient<WidgetAPIKeyCreatedResponse>(
      WIDGET_API_KEY_ENDPOINTS.CREATE(connectionId),
      {
        method: 'POST',
        body: data as Record<string, unknown>,
      }
    );

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    };
  }
};

/**
 * Soft-delete a widget API key.
 * @param connectionId Connection ID
 * @param keyId Widget API key ID
 * @returns Promise with message response
 */
export const deleteWidgetAPIKey = async (
  connectionId: number,
  keyId: number
): Promise<WidgetAPIKeyMessageResponse> => {
  try {
    const response = await fetchClient<WidgetAPIKeyMessageResponse>(
      WIDGET_API_KEY_ENDPOINTS.DELETE(connectionId, keyId),
      { method: 'DELETE' }
    );

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete API key',
    };
  }
};
