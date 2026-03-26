'use client';

import {
  AssayProtocolResponse,
  AssayProtocolsResponse,
  CreateAssayProtocol,
  UpdateAssayProtocol,
  CreateAssayProtocolSchema,
  UpdateAssayProtocolSchema,
} from '../../schemas/lims/assay-protocol.schemas';
import { ASSAY_PROTOCOL_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing assay protocols
 */
export interface ListAssayProtocolsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all assay protocols
 * @param params Optional query parameters for pagination
 * @returns Promise with assay protocols response
 */
export const getAssayProtocols = async (params?: ListAssayProtocolsParams): Promise<AssayProtocolsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ASSAY_PROTOCOL_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<AssayProtocolsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch assay protocols',
      data: []
    };
  }
};

/**
 * Fetch a specific assay protocol by ID
 * @param id Assay protocol ID
 * @returns Promise with assay protocol response
 */
export const getAssayProtocol = async (id: number): Promise<AssayProtocolResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayProtocolResponse>(ASSAY_PROTOCOL_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch assay protocol with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new assay protocol
 * @param data Assay protocol creation data
 * @returns Promise with assay protocol response
 */
export const createAssayProtocol = async (data: CreateAssayProtocol): Promise<AssayProtocolResponse> => {
  // Validate request data
  CreateAssayProtocolSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayProtocolResponse>(ASSAY_PROTOCOL_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assay protocol',
      data: undefined
    };
  }
};

/**
 * Update an existing assay protocol
 * @param id Assay protocol ID
 * @param data Assay protocol update data
 * @returns Promise with assay protocol response
 */
export const updateAssayProtocol = async (id: number, data: UpdateAssayProtocol): Promise<AssayProtocolResponse> => {
  // Validate request data
  UpdateAssayProtocolSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<AssayProtocolResponse>(ASSAY_PROTOCOL_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update assay protocol with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a assay protocol
 * @param id Assay protocol ID
 * @returns Promise with success response
 */
export const deleteAssayProtocol = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ASSAY_PROTOCOL_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete assay protocol with ID ${id}`
    };
  }
};
