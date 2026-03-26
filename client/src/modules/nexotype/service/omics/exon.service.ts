'use client';

import {
  ExonResponse,
  ExonsResponse,
  CreateExon,
  UpdateExon,
  CreateExonSchema,
  UpdateExonSchema,
} from '../../schemas/omics/exon.schemas';
import { EXON_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing exons
 */
export interface ListExonsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all exons
 * @param params Optional query parameters for pagination
 * @returns Promise with exons response
 */
export const getExons = async (params?: ListExonsParams): Promise<ExonsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${EXON_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ExonsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch exons',
      data: []
    };
  }
};

/**
 * Fetch a specific exon by ID
 * @param id Exon ID
 * @returns Promise with exon response
 */
export const getExon = async (id: number): Promise<ExonResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExonResponse>(EXON_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch exon with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new exon
 * @param data Exon creation data
 * @returns Promise with exon response
 */
export const createExon = async (data: CreateExon): Promise<ExonResponse> => {
  // Validate request data
  CreateExonSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExonResponse>(EXON_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create exon',
      data: undefined
    };
  }
};

/**
 * Update an existing exon
 * @param id Exon ID
 * @param data Exon update data
 * @returns Promise with exon response
 */
export const updateExon = async (id: number, data: UpdateExon): Promise<ExonResponse> => {
  // Validate request data
  UpdateExonSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ExonResponse>(EXON_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update exon with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an exon
 * @param id Exon ID
 * @returns Promise with success response
 */
export const deleteExon = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      EXON_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete exon with ID ${id}`
    };
  }
};
