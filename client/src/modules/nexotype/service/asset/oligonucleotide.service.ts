'use client';

import {
  OligonucleotideResponse,
  OligonucleotidesResponse,
  CreateOligonucleotide,
  UpdateOligonucleotide,
  CreateOligonucleotideSchema,
  UpdateOligonucleotideSchema,
} from '../../schemas/asset/oligonucleotide.schemas';
import { OLIGONUCLEOTIDE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing oligonucleotides
 */
export interface ListOligonucleotidesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all oligonucleotides
 * @param params Optional query parameters for pagination
 * @returns Promise with oligonucleotides response
 */
export const getOligonucleotides = async (params?: ListOligonucleotidesParams): Promise<OligonucleotidesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${OLIGONUCLEOTIDE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<OligonucleotidesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch oligonucleotides',
      data: []
    };
  }
};

/**
 * Fetch a specific oligonucleotide by ID
 * @param id Oligonucleotide ID
 * @returns Promise with oligonucleotide response
 */
export const getOligonucleotide = async (id: number): Promise<OligonucleotideResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OligonucleotideResponse>(OLIGONUCLEOTIDE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch oligonucleotide with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new oligonucleotide
 * @param data Oligonucleotide creation data
 * @returns Promise with oligonucleotide response
 */
export const createOligonucleotide = async (data: CreateOligonucleotide): Promise<OligonucleotideResponse> => {
  // Validate request data
  CreateOligonucleotideSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OligonucleotideResponse>(OLIGONUCLEOTIDE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create oligonucleotide',
      data: undefined
    };
  }
};

/**
 * Update an existing oligonucleotide
 * @param id Oligonucleotide ID
 * @param data Oligonucleotide update data
 * @returns Promise with oligonucleotide response
 */
export const updateOligonucleotide = async (id: number, data: UpdateOligonucleotide): Promise<OligonucleotideResponse> => {
  // Validate request data
  UpdateOligonucleotideSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OligonucleotideResponse>(OLIGONUCLEOTIDE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update oligonucleotide with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a oligonucleotide
 * @param id Oligonucleotide ID
 * @returns Promise with success response
 */
export const deleteOligonucleotide = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      OLIGONUCLEOTIDE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete oligonucleotide with ID ${id}`
    };
  }
};
