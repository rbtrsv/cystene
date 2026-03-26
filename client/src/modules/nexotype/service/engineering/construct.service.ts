'use client';

import {
  ConstructResponse,
  ConstructsResponse,
  CreateConstruct,
  UpdateConstruct,
  CreateConstructSchema,
  UpdateConstructSchema,
} from '../../schemas/engineering/construct.schemas';
import { CONSTRUCT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing constructs
 */
export interface ListConstructsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all constructs
 * @param params Optional query parameters for pagination
 * @returns Promise with constructs response
 */
export const getConstructs = async (params?: ListConstructsParams): Promise<ConstructsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${CONSTRUCT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ConstructsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch constructs',
      data: []
    };
  }
};

/**
 * Fetch a specific construct by ID
 * @param id Construct ID
 * @returns Promise with construct response
 */
export const getConstruct = async (id: number): Promise<ConstructResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ConstructResponse>(CONSTRUCT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch construct with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new construct
 * @param data Construct creation data
 * @returns Promise with construct response
 */
export const createConstruct = async (data: CreateConstruct): Promise<ConstructResponse> => {
  // Validate request data
  CreateConstructSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ConstructResponse>(CONSTRUCT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create construct',
      data: undefined
    };
  }
};

/**
 * Update an existing construct
 * @param id Construct ID
 * @param data Construct update data
 * @returns Promise with construct response
 */
export const updateConstruct = async (id: number, data: UpdateConstruct): Promise<ConstructResponse> => {
  // Validate request data
  UpdateConstructSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ConstructResponse>(CONSTRUCT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update construct with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a construct
 * @param id Construct ID
 * @returns Promise with success response
 */
export const deleteConstruct = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      CONSTRUCT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete construct with ID ${id}`
    };
  }
};
