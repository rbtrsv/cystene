'use client';

import {
  TechnologyPlatformResponse,
  TechnologyPlatformsResponse,
  CreateTechnologyPlatform,
  UpdateTechnologyPlatform,
  CreateTechnologyPlatformSchema,
  UpdateTechnologyPlatformSchema,
} from '../../schemas/commercial/technology-platform.schemas';
import { TECHNOLOGY_PLATFORM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing technology platforms
 */
export interface ListTechnologyPlatformsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all technology platforms
 * @param params Optional query parameters for pagination
 * @returns Promise with technology platforms response
 */
export const getTechnologyPlatforms = async (params?: ListTechnologyPlatformsParams): Promise<TechnologyPlatformsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${TECHNOLOGY_PLATFORM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TechnologyPlatformsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch technology platforms',
      data: []
    };
  }
};

/**
 * Fetch a specific technology platform by ID
 * @param id TechnologyPlatform ID
 * @returns Promise with technology platform response
 */
export const getTechnologyPlatform = async (id: number): Promise<TechnologyPlatformResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TechnologyPlatformResponse>(TECHNOLOGY_PLATFORM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new technology platform
 * @param data TechnologyPlatform creation data
 * @returns Promise with technology platform response
 */
export const createTechnologyPlatform = async (data: CreateTechnologyPlatform): Promise<TechnologyPlatformResponse> => {
  // Validate request data
  CreateTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TechnologyPlatformResponse>(TECHNOLOGY_PLATFORM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create technology platform',
      data: undefined
    };
  }
};

/**
 * Update an existing technology platform
 * @param id TechnologyPlatform ID
 * @param data TechnologyPlatform update data
 * @returns Promise with technology platform response
 */
export const updateTechnologyPlatform = async (id: number, data: UpdateTechnologyPlatform): Promise<TechnologyPlatformResponse> => {
  // Validate request data
  UpdateTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TechnologyPlatformResponse>(TECHNOLOGY_PLATFORM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a technology platform
 * @param id TechnologyPlatform ID
 * @returns Promise with success response
 */
export const deleteTechnologyPlatform = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      TECHNOLOGY_PLATFORM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete technology platform with ID ${id}`
    };
  }
};
