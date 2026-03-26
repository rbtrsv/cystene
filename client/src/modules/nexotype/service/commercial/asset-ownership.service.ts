'use client';

import {
  AssetOwnershipResponse,
  AssetOwnershipsResponse,
  CreateAssetOwnership,
  UpdateAssetOwnership,
  CreateAssetOwnershipSchema,
  UpdateAssetOwnershipSchema,
} from '../../schemas/commercial/asset-ownership.schemas';
import { ASSET_OWNERSHIP_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing asset ownerships
 */
export interface ListAssetOwnershipsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all asset ownerships
 * @param params Optional query parameters for pagination
 * @returns Promise with asset ownerships response
 */
export const getAssetOwnerships = async (params?: ListAssetOwnershipsParams): Promise<AssetOwnershipsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSET_OWNERSHIP_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<AssetOwnershipsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch asset ownerships',
      data: []
    };
  }
};

/**
 * Fetch a specific asset ownership by ID
 * @param id AssetOwnership ID
 * @returns Promise with asset ownership response
 */
export const getAssetOwnership = async (id: number): Promise<AssetOwnershipResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetOwnershipResponse>(ASSET_OWNERSHIP_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch asset ownership with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new asset ownership
 * @param data AssetOwnership creation data
 * @returns Promise with asset ownership response
 */
export const createAssetOwnership = async (data: CreateAssetOwnership): Promise<AssetOwnershipResponse> => {
  // Validate request data
  CreateAssetOwnershipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetOwnershipResponse>(ASSET_OWNERSHIP_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create asset ownership',
      data: undefined
    };
  }
};

/**
 * Update an existing asset ownership
 * @param id AssetOwnership ID
 * @param data AssetOwnership update data
 * @returns Promise with asset ownership response
 */
export const updateAssetOwnership = async (id: number, data: UpdateAssetOwnership): Promise<AssetOwnershipResponse> => {
  // Validate request data
  UpdateAssetOwnershipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssetOwnershipResponse>(ASSET_OWNERSHIP_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update asset ownership with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a asset ownership
 * @param id AssetOwnership ID
 * @returns Promise with success response
 */
export const deleteAssetOwnership = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ASSET_OWNERSHIP_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete asset ownership with ID ${id}`
    };
  }
};
