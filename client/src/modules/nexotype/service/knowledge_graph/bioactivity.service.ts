'use client';

import {
  BioactivityResponse,
  BioactivitiesResponse,
  CreateBioactivity,
  UpdateBioactivity,
  CreateBioactivitySchema,
  UpdateBioactivitySchema,
} from '../../schemas/knowledge_graph/bioactivity.schemas';
import { BIOACTIVITY_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing bioactivities
 */
export interface ListBioactivitiesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all bioactivities
 * @param params Optional query parameters for pagination
 * @returns Promise with bioactivities response
 */
export const getBioactivities = async (params?: ListBioactivitiesParams): Promise<BioactivitiesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOACTIVITY_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BioactivitiesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch bioactivities',
      data: []
    };
  }
};

/**
 * Fetch a specific bioactivity by ID
 * @param id Bioactivity ID
 * @returns Promise with bioactivity response
 */
export const getBioactivity = async (id: number): Promise<BioactivityResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BioactivityResponse>(BIOACTIVITY_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch bioactivity with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new bioactivity
 * @param data Bioactivity creation data
 * @returns Promise with bioactivity response
 */
export const createBioactivity = async (data: CreateBioactivity): Promise<BioactivityResponse> => {
  // Validate request data
  CreateBioactivitySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BioactivityResponse>(BIOACTIVITY_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bioactivity',
      data: undefined
    };
  }
};

/**
 * Update an existing bioactivity
 * @param id Bioactivity ID
 * @param data Bioactivity update data
 * @returns Promise with bioactivity response
 */
export const updateBioactivity = async (id: number, data: UpdateBioactivity): Promise<BioactivityResponse> => {
  // Validate request data
  UpdateBioactivitySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BioactivityResponse>(BIOACTIVITY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update bioactivity with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a bioactivity
 * @param id Bioactivity ID
 * @returns Promise with success response
 */
export const deleteBioactivity = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOACTIVITY_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete bioactivity with ID ${id}`
    };
  }
};
