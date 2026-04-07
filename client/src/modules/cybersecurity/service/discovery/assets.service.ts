'use client';

/**
 * Asset Service
 *
 * Read-only operations for Asset model.
 * No create/update/delete — scanner discovers assets, user views them.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/asset_subrouter.py
 */

import {
  AssetResponse,
  AssetsResponse,
  AssetType,
} from '../../schemas/discovery/assets.schemas';
import { ASSET_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing assets
 */
export interface ListAssetsParams {
  scan_job_id?: number;
  asset_type?: AssetType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all assets user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with assets response
 */
export const getAssets = async (params?: ListAssetsParams): Promise<AssetsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.scan_job_id) queryParams.append('scan_job_id', params.scan_job_id.toString());
    if (params?.asset_type) queryParams.append('asset_type', params.asset_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSET_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetsResponse>(url, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assets',
      data: []
    };
  }
};

/**
 * Fetch a specific asset by ID
 * @param id Asset ID
 * @returns Promise with asset response
 */
export const getAsset = async (id: number): Promise<AssetResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetResponse>(ASSET_ENDPOINTS.DETAIL(id), {
      method: 'GET'
    });

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch asset with ID ${id}`,
      data: undefined
    };
  }
};
