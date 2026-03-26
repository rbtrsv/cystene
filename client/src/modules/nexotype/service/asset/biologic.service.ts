'use client';

import {
  BiologicResponse,
  BiologicsResponse,
  CreateBiologic,
  UpdateBiologic,
  CreateBiologicSchema,
  UpdateBiologicSchema,
} from '../../schemas/asset/biologic.schemas';
import { BIOLOGIC_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing biologics
 */
export interface ListBiologicsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all biologics
 * @param params Optional query parameters for pagination
 * @returns Promise with biologics response
 */
export const getBiologics = async (params?: ListBiologicsParams): Promise<BiologicsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOLOGIC_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BiologicsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch biologics',
      data: []
    };
  }
};

/**
 * Fetch a specific biologic by ID
 * @param id Biologic ID
 * @returns Promise with biologic response
 */
export const getBiologic = async (id: number): Promise<BiologicResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicResponse>(BIOLOGIC_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch biologic with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new biologic
 * @param data Biologic creation data
 * @returns Promise with biologic response
 */
export const createBiologic = async (data: CreateBiologic): Promise<BiologicResponse> => {
  // Validate request data
  CreateBiologicSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicResponse>(BIOLOGIC_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create biologic',
      data: undefined
    };
  }
};

/**
 * Update an existing biologic
 * @param id Biologic ID
 * @param data Biologic update data
 * @returns Promise with biologic response
 */
export const updateBiologic = async (id: number, data: UpdateBiologic): Promise<BiologicResponse> => {
  // Validate request data
  UpdateBiologicSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicResponse>(BIOLOGIC_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update biologic with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a biologic
 * @param id Biologic ID
 * @returns Promise with success response
 */
export const deleteBiologic = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOLOGIC_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete biologic with ID ${id}`
    };
  }
};
