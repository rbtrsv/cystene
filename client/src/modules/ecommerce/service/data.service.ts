'use client';

import { ConnectionStats, ConnectionStatsResponse } from '../schemas/data.schemas';
import { DATA_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';

// Type for sync response — same as ConnectionStatsResponse (POST /data/sync returns stats)
export type SyncResponse = ConnectionStatsResponse;

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

// ==========================================
// Product Types (for Components page dropdown)
// ==========================================

/**
 * Simplified product representation for dropdown selection.
 * Backend returns: { product_id, title, image_url }
 */
export interface DataProduct {
  product_id: string;
  title: string;
  image_url: string;
}

/**
 * Response from GET /data/products/{connection_id}
 * Backend returns: { products: [...], count: N }
 */
export interface DataProductsResponse {
  products: DataProduct[];
  count: number;
}

/**
 * Fetch connection statistics (products count, orders count, etc.)
 * @param connectionId Connection ID
 * @returns Promise with connection stats response
 */
export const getConnectionStats = async (connectionId: number): Promise<ConnectionStatsResponse> => {
  try {
    // Backend returns { success, data: ConnectionStats } — unwrap the envelope
    const response = await fetchClient<{ success: boolean; data: ConnectionStats; error?: string }>(
      DATA_ENDPOINTS.STATS(connectionId),
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
      error: error instanceof Error ? error.message : `Failed to fetch stats for connection ${connectionId}`,
      data: undefined,
    };
  }
};

/**
 * Fetch simplified product list for the Components page dropdown.
 * Returns product_id, title, image_url for each active product.
 * @param connectionId Connection ID
 * @returns Promise with products response
 */
export const getProducts = async (connectionId: number): Promise<DataProductsResponse> => {
  try {
    // Backend returns { products: [...], count: N } — no envelope to unwrap
    const response = await fetchClient<DataProductsResponse>(
      DATA_ENDPOINTS.PRODUCTS(connectionId),
      { method: 'GET' }
    );

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('@/modules/accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      products: [],
      count: 0,
    };
  }
};

/**
 * Trigger a manual data sync for a connection.
 * Pulls latest data from the platform adapter and upserts locally.
 * @param connectionId Connection ID
 * @returns Promise with sync stats response
 */
export const syncConnection = async (connectionId: number): Promise<SyncResponse> => {
  try {
    // Backend returns { success, data: ConnectionStats } — same as stats response
    const response = await fetchClient<{ success: boolean; data: ConnectionStats; error?: string }>(
      DATA_ENDPOINTS.SYNC(connectionId),
      { method: 'POST' }
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
      error: error instanceof Error ? error.message : `Failed to sync connection ${connectionId}`,
      data: undefined,
    };
  }
};
