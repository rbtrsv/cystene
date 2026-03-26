'use client';

import {
  BiospecimenResponse,
  BiospecimensResponse,
  CreateBiospecimen,
  UpdateBiospecimen,
  CreateBiospecimenSchema,
  UpdateBiospecimenSchema,
} from '../../schemas/lims/biospecimen.schemas';
import { BIOSPECIMEN_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing biospecimens
 */
export interface ListBiospecimensParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all biospecimens
 * @param params Optional query parameters for pagination
 * @returns Promise with biospecimens response
 */
export const getBiospecimens = async (params?: ListBiospecimensParams): Promise<BiospecimensResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOSPECIMEN_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BiospecimensResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch biospecimens',
      data: []
    };
  }
};

/**
 * Fetch a specific biospecimen by ID
 * @param id Biospecimen ID
 * @returns Promise with biospecimen response
 */
export const getBiospecimen = async (id: number): Promise<BiospecimenResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiospecimenResponse>(BIOSPECIMEN_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch biospecimen with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new biospecimen
 * @param data Biospecimen creation data
 * @returns Promise with biospecimen response
 */
export const createBiospecimen = async (data: CreateBiospecimen): Promise<BiospecimenResponse> => {
  // Validate request data
  CreateBiospecimenSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiospecimenResponse>(BIOSPECIMEN_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create biospecimen',
      data: undefined
    };
  }
};

/**
 * Update an existing biospecimen
 * @param id Biospecimen ID
 * @param data Biospecimen update data
 * @returns Promise with biospecimen response
 */
export const updateBiospecimen = async (id: number, data: UpdateBiospecimen): Promise<BiospecimenResponse> => {
  // Validate request data
  UpdateBiospecimenSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiospecimenResponse>(BIOSPECIMEN_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update biospecimen with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a biospecimen
 * @param id Biospecimen ID
 * @returns Promise with success response
 */
export const deleteBiospecimen = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOSPECIMEN_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete biospecimen with ID ${id}`
    };
  }
};
