'use client';

import {
  PhenotypeResponse,
  PhenotypesResponse,
  CreatePhenotype,
  UpdatePhenotype,
  CreatePhenotypeSchema,
  UpdatePhenotypeSchema,
} from '../../schemas/clinical/phenotype.schemas';
import { PHENOTYPE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing phenotypes
 */
export interface ListPhenotypesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all phenotypes
 * @param params Optional query parameters for pagination
 * @returns Promise with phenotypes response
 */
export const getPhenotypes = async (params?: ListPhenotypesParams): Promise<PhenotypesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PHENOTYPE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PhenotypesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch phenotypes',
      data: []
    };
  }
};

/**
 * Fetch a specific phenotype by ID
 * @param id Phenotype ID
 * @returns Promise with phenotype response
 */
export const getPhenotype = async (id: number): Promise<PhenotypeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PhenotypeResponse>(PHENOTYPE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch phenotype with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new phenotype
 * @param data Phenotype creation data
 * @returns Promise with phenotype response
 */
export const createPhenotype = async (data: CreatePhenotype): Promise<PhenotypeResponse> => {
  // Validate request data
  CreatePhenotypeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PhenotypeResponse>(PHENOTYPE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create phenotype',
      data: undefined
    };
  }
};

/**
 * Update an existing phenotype
 * @param id Phenotype ID
 * @param data Phenotype update data
 * @returns Promise with phenotype response
 */
export const updatePhenotype = async (id: number, data: UpdatePhenotype): Promise<PhenotypeResponse> => {
  // Validate request data
  UpdatePhenotypeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PhenotypeResponse>(PHENOTYPE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update phenotype with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a phenotype
 * @param id Phenotype ID
 * @returns Promise with success response
 */
export const deletePhenotype = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PHENOTYPE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete phenotype with ID ${id}`
    };
  }
};
