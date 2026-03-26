'use client';

import {
  ProteinResponse,
  ProteinsResponse,
  CreateProtein,
  UpdateProtein,
  CreateProteinSchema,
  UpdateProteinSchema,
} from '../../schemas/omics/protein.schemas';
import { PROTEIN_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing proteins
 */
export interface ListProteinsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all proteins
 * @param params Optional query parameters for pagination
 * @returns Promise with proteins response
 */
export const getProteins = async (params?: ListProteinsParams): Promise<ProteinsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PROTEIN_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ProteinsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch proteins',
      data: []
    };
  }
};

/**
 * Fetch a specific protein by ID
 * @param id Protein ID
 * @returns Promise with protein response
 */
export const getProtein = async (id: number): Promise<ProteinResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinResponse>(PROTEIN_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch protein with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new protein
 * @param data Protein creation data
 * @returns Promise with protein response
 */
export const createProtein = async (data: CreateProtein): Promise<ProteinResponse> => {
  // Validate request data
  CreateProteinSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinResponse>(PROTEIN_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create protein',
      data: undefined
    };
  }
};

/**
 * Update an existing protein
 * @param id Protein ID
 * @param data Protein update data
 * @returns Promise with protein response
 */
export const updateProtein = async (id: number, data: UpdateProtein): Promise<ProteinResponse> => {
  // Validate request data
  UpdateProteinSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ProteinResponse>(PROTEIN_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update protein with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a protein
 * @param id Protein ID
 * @returns Promise with success response
 */
export const deleteProtein = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PROTEIN_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete protein with ID ${id}`
    };
  }
};
