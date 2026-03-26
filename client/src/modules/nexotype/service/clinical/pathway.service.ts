'use client';

import {
  PathwayResponse,
  PathwaysResponse,
  CreatePathway,
  UpdatePathway,
  CreatePathwaySchema,
  UpdatePathwaySchema,
} from '../../schemas/clinical/pathway.schemas';
import { PATHWAY_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing pathways
 */
export interface ListPathwaysParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all pathways
 * @param params Optional query parameters for pagination
 * @returns Promise with pathways response
 */
export const getPathways = async (params?: ListPathwaysParams): Promise<PathwaysResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATHWAY_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PathwaysResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch pathways',
      data: []
    };
  }
};

/**
 * Fetch a specific pathway by ID
 * @param id Pathway ID
 * @returns Promise with pathway response
 */
export const getPathway = async (id: number): Promise<PathwayResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayResponse>(PATHWAY_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch pathway with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new pathway
 * @param data Pathway creation data
 * @returns Promise with pathway response
 */
export const createPathway = async (data: CreatePathway): Promise<PathwayResponse> => {
  // Validate request data
  CreatePathwaySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayResponse>(PATHWAY_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pathway',
      data: undefined
    };
  }
};

/**
 * Update an existing pathway
 * @param id Pathway ID
 * @param data Pathway update data
 * @returns Promise with pathway response
 */
export const updatePathway = async (id: number, data: UpdatePathway): Promise<PathwayResponse> => {
  // Validate request data
  UpdatePathwaySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayResponse>(PATHWAY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update pathway with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a pathway
 * @param id Pathway ID
 * @returns Promise with success response
 */
export const deletePathway = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATHWAY_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete pathway with ID ${id}`
    };
  }
};
