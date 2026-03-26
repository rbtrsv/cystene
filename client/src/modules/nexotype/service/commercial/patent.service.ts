'use client';

import {
  PatentResponse,
  PatentsResponse,
  CreatePatent,
  UpdatePatent,
  CreatePatentSchema,
  UpdatePatentSchema,
} from '../../schemas/commercial/patent.schemas';
import { PATENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing patents
 */
export interface ListPatentsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all patents
 * @param params Optional query parameters for pagination
 * @returns Promise with patents response
 */
export const getPatents = async (params?: ListPatentsParams): Promise<PatentsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PatentsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch patents',
      data: []
    };
  }
};

/**
 * Fetch a specific patent by ID
 * @param id Patent ID
 * @returns Promise with patent response
 */
export const getPatent = async (id: number): Promise<PatentResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentResponse>(PATENT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch patent with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new patent
 * @param data Patent creation data
 * @returns Promise with patent response
 */
export const createPatent = async (data: CreatePatent): Promise<PatentResponse> => {
  // Validate request data
  CreatePatentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentResponse>(PATENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create patent',
      data: undefined
    };
  }
};

/**
 * Update an existing patent
 * @param id Patent ID
 * @param data Patent update data
 * @returns Promise with patent response
 */
export const updatePatent = async (id: number, data: UpdatePatent): Promise<PatentResponse> => {
  // Validate request data
  UpdatePatentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentResponse>(PATENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update patent with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a patent
 * @param id Patent ID
 * @returns Promise with success response
 */
export const deletePatent = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATENT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete patent with ID ${id}`
    };
  }
};
