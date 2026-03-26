'use client';

import {
  AssayReadoutResponse,
  AssayReadoutsResponse,
  CreateAssayReadout,
  UpdateAssayReadout,
  CreateAssayReadoutSchema,
  UpdateAssayReadoutSchema,
} from '../../schemas/lims/assay-readout.schemas';
import { ASSAY_READOUT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing assay readouts
 */
export interface ListAssayReadoutsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all assay readouts
 * @param params Optional query parameters for pagination
 * @returns Promise with assay readouts response
 */
export const getAssayReadouts = async (params?: ListAssayReadoutsParams): Promise<AssayReadoutsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSAY_READOUT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<AssayReadoutsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch assay readouts',
      data: []
    };
  }
};

/**
 * Fetch a specific assay readout by ID
 * @param id Assay readout ID
 * @returns Promise with assay readout response
 */
export const getAssayReadout = async (id: number): Promise<AssayReadoutResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayReadoutResponse>(ASSAY_READOUT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch assay readout with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new assay readout
 * @param data Assay readout creation data
 * @returns Promise with assay readout response
 */
export const createAssayReadout = async (data: CreateAssayReadout): Promise<AssayReadoutResponse> => {
  // Validate request data
  CreateAssayReadoutSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayReadoutResponse>(ASSAY_READOUT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assay readout',
      data: undefined
    };
  }
};

/**
 * Update an existing assay readout
 * @param id Assay readout ID
 * @param data Assay readout update data
 * @returns Promise with assay readout response
 */
export const updateAssayReadout = async (id: number, data: UpdateAssayReadout): Promise<AssayReadoutResponse> => {
  // Validate request data
  UpdateAssayReadoutSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayReadoutResponse>(ASSAY_READOUT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update assay readout with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a assay readout
 * @param id Assay readout ID
 * @returns Promise with success response
 */
export const deleteAssayReadout = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ASSAY_READOUT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete assay readout with ID ${id}`
    };
  }
};
