'use client';

import {
  TherapeuticAssetResponse,
  TherapeuticAssetsResponse,
  CreateTherapeuticAsset,
  UpdateTherapeuticAsset,
  CreateTherapeuticAssetSchema,
  UpdateTherapeuticAssetSchema,
} from '../../schemas/asset/therapeutic-asset.schemas';
import { THERAPEUTIC_ASSET_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing therapeutic assets
 */
export interface ListTherapeuticAssetsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all therapeutic assets
 * @param params Optional query parameters for pagination
 * @returns Promise with therapeutic assets response
 */
export const getTherapeuticAssets = async (params?: ListTherapeuticAssetsParams): Promise<TherapeuticAssetsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${THERAPEUTIC_ASSET_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TherapeuticAssetsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch therapeutic assets',
      data: []
    };
  }
};

/**
 * Fetch a specific therapeutic asset by ID
 * @param id Therapeutic asset ID
 * @returns Promise with therapeutic asset response
 */
export const getTherapeuticAsset = async (id: number): Promise<TherapeuticAssetResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticAssetResponse>(THERAPEUTIC_ASSET_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch therapeutic asset with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new therapeutic asset
 * @param data Therapeutic asset creation data
 * @returns Promise with therapeutic asset response
 */
export const createTherapeuticAsset = async (data: CreateTherapeuticAsset): Promise<TherapeuticAssetResponse> => {
  // Validate request data
  CreateTherapeuticAssetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticAssetResponse>(THERAPEUTIC_ASSET_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create therapeutic asset',
      data: undefined
    };
  }
};

/**
 * Update an existing therapeutic asset
 * @param id Therapeutic asset ID
 * @param data Therapeutic asset update data
 * @returns Promise with therapeutic asset response
 */
export const updateTherapeuticAsset = async (id: number, data: UpdateTherapeuticAsset): Promise<TherapeuticAssetResponse> => {
  // Validate request data
  UpdateTherapeuticAssetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticAssetResponse>(THERAPEUTIC_ASSET_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update therapeutic asset with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a therapeutic asset
 * @param id Therapeutic asset ID
 * @returns Promise with success response
 */
export const deleteTherapeuticAsset = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      THERAPEUTIC_ASSET_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete therapeutic asset with ID ${id}`
    };
  }
};
