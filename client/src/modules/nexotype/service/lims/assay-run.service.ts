'use client';

import {
  AssayRunResponse,
  AssayRunsResponse,
  CreateAssayRun,
  UpdateAssayRun,
  CreateAssayRunSchema,
  UpdateAssayRunSchema,
} from '../../schemas/lims/assay-run.schemas';
import { ASSAY_RUN_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing assay runs
 */
export interface ListAssayRunsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all assay runs
 * @param params Optional query parameters for pagination
 * @returns Promise with assay runs response
 */
export const getAssayRuns = async (params?: ListAssayRunsParams): Promise<AssayRunsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSAY_RUN_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<AssayRunsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch assay runs',
      data: []
    };
  }
};

/**
 * Fetch a specific assay run by ID
 * @param id Assay run ID
 * @returns Promise with assay run response
 */
export const getAssayRun = async (id: number): Promise<AssayRunResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayRunResponse>(ASSAY_RUN_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch assay run with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new assay run
 * @param data Assay run creation data
 * @returns Promise with assay run response
 */
export const createAssayRun = async (data: CreateAssayRun): Promise<AssayRunResponse> => {
  // Validate request data
  CreateAssayRunSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayRunResponse>(ASSAY_RUN_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assay run',
      data: undefined
    };
  }
};

/**
 * Update an existing assay run
 * @param id Assay run ID
 * @param data Assay run update data
 * @returns Promise with assay run response
 */
export const updateAssayRun = async (id: number, data: UpdateAssayRun): Promise<AssayRunResponse> => {
  // Validate request data
  UpdateAssayRunSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayRunResponse>(ASSAY_RUN_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update assay run with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a assay run
 * @param id Assay run ID
 * @returns Promise with success response
 */
export const deleteAssayRun = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ASSAY_RUN_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete assay run with ID ${id}`
    };
  }
};
