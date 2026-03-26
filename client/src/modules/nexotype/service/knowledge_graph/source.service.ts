'use client';

import {
  SourceResponse,
  SourcesResponse,
  CreateSource,
  UpdateSource,
  CreateSourceSchema,
  UpdateSourceSchema,
} from '../../schemas/knowledge_graph/source.schemas';
import { SOURCE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing sources
 */
export interface ListSourcesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all sources
 * @param params Optional query parameters for pagination
 * @returns Promise with sources response
 */
export const getSources = async (params?: ListSourcesParams): Promise<SourcesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SOURCE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<SourcesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch sources',
      data: []
    };
  }
};

/**
 * Fetch a specific source by ID
 * @param id Source ID
 * @returns Promise with source response
 */
export const getSource = async (id: number): Promise<SourceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SourceResponse>(SOURCE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch source with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new source
 * @param data Source creation data
 * @returns Promise with source response
 */
export const createSource = async (data: CreateSource): Promise<SourceResponse> => {
  // Validate request data
  CreateSourceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SourceResponse>(SOURCE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create source',
      data: undefined
    };
  }
};

/**
 * Update an existing source
 * @param id Source ID
 * @param data Source update data
 * @returns Promise with source response
 */
export const updateSource = async (id: number, data: UpdateSource): Promise<SourceResponse> => {
  // Validate request data
  UpdateSourceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SourceResponse>(SOURCE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update source with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a source
 * @param id Source ID
 * @returns Promise with success response
 */
export const deleteSource = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SOURCE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete source with ID ${id}`
    };
  }
};
