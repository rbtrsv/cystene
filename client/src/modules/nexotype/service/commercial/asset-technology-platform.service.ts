'use client';

import {
  AssetTechnologyPlatformResponse,
  AssetTechnologyPlatformsResponse,
  CreateAssetTechnologyPlatform,
  UpdateAssetTechnologyPlatform,
  CreateAssetTechnologyPlatformSchema,
  UpdateAssetTechnologyPlatformSchema,
} from '../../schemas/commercial/asset-technology-platform.schemas';
import { ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing asset technology platforms
 */
export interface ListAssetTechnologyPlatformsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all asset technology platforms
 * @param params Optional query parameters for pagination
 * @returns Promise with asset technology platforms response
 */
export const getAssetTechnologyPlatforms = async (params?: ListAssetTechnologyPlatformsParams): Promise<AssetTechnologyPlatformsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<AssetTechnologyPlatformsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch asset technology platforms',
      data: []
    };
  }
};

/**
 * Fetch a specific asset technology platform by ID
 * @param id AssetTechnologyPlatform ID
 * @returns Promise with asset technology platform response
 */
export const getAssetTechnologyPlatform = async (id: number): Promise<AssetTechnologyPlatformResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetTechnologyPlatformResponse>(ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch asset technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new asset technology platform
 * @param data AssetTechnologyPlatform creation data
 * @returns Promise with asset technology platform response
 */
export const createAssetTechnologyPlatform = async (data: CreateAssetTechnologyPlatform): Promise<AssetTechnologyPlatformResponse> => {
  // Validate request data
  CreateAssetTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetTechnologyPlatformResponse>(ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create asset technology platform',
      data: undefined
    };
  }
};

/**
 * Update an existing asset technology platform
 * @param id AssetTechnologyPlatform ID
 * @param data AssetTechnologyPlatform update data
 * @returns Promise with asset technology platform response
 */
export const updateAssetTechnologyPlatform = async (id: number, data: UpdateAssetTechnologyPlatform): Promise<AssetTechnologyPlatformResponse> => {
  // Validate request data
  UpdateAssetTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetTechnologyPlatformResponse>(ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update asset technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a asset technology platform
 * @param id AssetTechnologyPlatform ID
 * @returns Promise with success response
 */
export const deleteAssetTechnologyPlatform = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ASSET_TECHNOLOGY_PLATFORM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete asset technology platform with ID ${id}`
    };
  }
};
