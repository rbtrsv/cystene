'use client';

import {
  BiomarkerResponse,
  BiomarkersResponse,
  CreateBiomarker,
  UpdateBiomarker,
  CreateBiomarkerSchema,
  UpdateBiomarkerSchema,
} from '../../schemas/clinical/biomarker.schemas';
import { BIOMARKER_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing biomarkers
 */
export interface ListBiomarkersParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all biomarkers
 * @param params Optional query parameters for pagination
 * @returns Promise with biomarkers response
 */
export const getBiomarkers = async (params?: ListBiomarkersParams): Promise<BiomarkersResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOMARKER_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BiomarkersResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch biomarkers',
      data: []
    };
  }
};

/**
 * Fetch a specific biomarker by ID
 * @param id Biomarker ID
 * @returns Promise with biomarker response
 */
export const getBiomarker = async (id: number): Promise<BiomarkerResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerResponse>(BIOMARKER_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch biomarker with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new biomarker
 * @param data Biomarker creation data
 * @returns Promise with biomarker response
 */
export const createBiomarker = async (data: CreateBiomarker): Promise<BiomarkerResponse> => {
  // Validate request data
  CreateBiomarkerSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerResponse>(BIOMARKER_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create biomarker',
      data: undefined
    };
  }
};

/**
 * Update an existing biomarker
 * @param id Biomarker ID
 * @param data Biomarker update data
 * @returns Promise with biomarker response
 */
export const updateBiomarker = async (id: number, data: UpdateBiomarker): Promise<BiomarkerResponse> => {
  // Validate request data
  UpdateBiomarkerSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiomarkerResponse>(BIOMARKER_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update biomarker with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a biomarker
 * @param id Biomarker ID
 * @returns Promise with success response
 */
export const deleteBiomarker = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOMARKER_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete biomarker with ID ${id}`
    };
  }
};
