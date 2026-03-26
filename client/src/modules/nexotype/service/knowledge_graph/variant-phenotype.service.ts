'use client';

import {
  VariantPhenotypeResponse,
  VariantPhenotypesResponse,
  CreateVariantPhenotype,
  UpdateVariantPhenotype,
  CreateVariantPhenotypeSchema,
  UpdateVariantPhenotypeSchema,
} from '../../schemas/knowledge_graph/variant-phenotype.schemas';
import { VARIANT_PHENOTYPE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing variant phenotypes
 */
export interface ListVariantPhenotypesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all variant phenotypes
 * @param params Optional query parameters for pagination
 * @returns Promise with variant phenotypes response
 */
export const getVariantPhenotypes = async (params?: ListVariantPhenotypesParams): Promise<VariantPhenotypesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${VARIANT_PHENOTYPE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<VariantPhenotypesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch variant phenotypes',
      data: []
    };
  }
};

/**
 * Fetch a specific variant phenotype by ID
 * @param id VariantPhenotype ID
 * @returns Promise with variant phenotype response
 */
export const getVariantPhenotype = async (id: number): Promise<VariantPhenotypeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantPhenotypeResponse>(VARIANT_PHENOTYPE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch variant phenotype with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new variant phenotype
 * @param data VariantPhenotype creation data
 * @returns Promise with variant phenotype response
 */
export const createVariantPhenotype = async (data: CreateVariantPhenotype): Promise<VariantPhenotypeResponse> => {
  // Validate request data
  CreateVariantPhenotypeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantPhenotypeResponse>(VARIANT_PHENOTYPE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variant phenotype',
      data: undefined
    };
  }
};

/**
 * Update an existing variant phenotype
 * @param id VariantPhenotype ID
 * @param data VariantPhenotype update data
 * @returns Promise with variant phenotype response
 */
export const updateVariantPhenotype = async (id: number, data: UpdateVariantPhenotype): Promise<VariantPhenotypeResponse> => {
  // Validate request data
  UpdateVariantPhenotypeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantPhenotypeResponse>(VARIANT_PHENOTYPE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update variant phenotype with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a variant phenotype
 * @param id VariantPhenotype ID
 * @returns Promise with success response
 */
export const deleteVariantPhenotype = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      VARIANT_PHENOTYPE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete variant phenotype with ID ${id}`
    };
  }
};
