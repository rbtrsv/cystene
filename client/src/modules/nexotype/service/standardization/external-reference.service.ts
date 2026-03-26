'use client';

import {
  ExternalReferenceResponse,
  ExternalReferencesResponse,
  CreateExternalReference,
  UpdateExternalReference,
  CreateExternalReferenceSchema,
  UpdateExternalReferenceSchema,
} from '../../schemas/standardization/external-reference.schemas';
import { EXTERNAL_REFERENCE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing external references
 */
export interface ListExternalReferencesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all external references
 * @param params Optional query parameters for pagination
 * @returns Promise with external references response
 */
export const getExternalReferences = async (params?: ListExternalReferencesParams): Promise<ExternalReferencesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${EXTERNAL_REFERENCE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ExternalReferencesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch external references',
      data: []
    };
  }
};

/**
 * Fetch a specific external reference by ID
 * @param id External reference ID
 * @returns Promise with external reference response
 */
export const getExternalReference = async (id: number): Promise<ExternalReferenceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExternalReferenceResponse>(EXTERNAL_REFERENCE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch external reference with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new external reference
 * @param data External reference creation data
 * @returns Promise with external reference response
 */
export const createExternalReference = async (data: CreateExternalReference): Promise<ExternalReferenceResponse> => {
  // Validate request data
  CreateExternalReferenceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExternalReferenceResponse>(EXTERNAL_REFERENCE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create external reference',
      data: undefined
    };
  }
};

/**
 * Update an existing external reference
 * @param id External reference ID
 * @param data External reference update data
 * @returns Promise with external reference response
 */
export const updateExternalReference = async (id: number, data: UpdateExternalReference): Promise<ExternalReferenceResponse> => {
  // Validate request data
  UpdateExternalReferenceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExternalReferenceResponse>(EXTERNAL_REFERENCE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update external reference with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an external reference
 * @param id External reference ID
 * @returns Promise with success response
 */
export const deleteExternalReference = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      EXTERNAL_REFERENCE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete external reference with ID ${id}`
    };
  }
};
