'use client';

import {
  GeneResponse,
  GenesResponse,
  CreateGene,
  UpdateGene,
  CreateGeneSchema,
  UpdateGeneSchema,
} from '../../schemas/omics/gene.schemas';
import { GENE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing genes
 */
export interface ListGenesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all genes
 * @param params Optional query parameters for pagination
 * @returns Promise with genes response
 */
export const getGenes = async (params?: ListGenesParams): Promise<GenesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${GENE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<GenesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch genes',
      data: []
    };
  }
};

/**
 * Fetch a specific gene by ID
 * @param id Gene ID
 * @returns Promise with gene response
 */
export const getGene = async (id: number): Promise<GeneResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GeneResponse>(GENE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch gene with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new gene
 * @param data Gene creation data
 * @returns Promise with gene response
 */
export const createGene = async (data: CreateGene): Promise<GeneResponse> => {
  // Validate request data
  CreateGeneSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GeneResponse>(GENE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create gene',
      data: undefined
    };
  }
};

/**
 * Update an existing gene
 * @param id Gene ID
 * @param data Gene update data
 * @returns Promise with gene response
 */
export const updateGene = async (id: number, data: UpdateGene): Promise<GeneResponse> => {
  // Validate request data
  UpdateGeneSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GeneResponse>(GENE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update gene with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a gene
 * @param id Gene ID
 * @returns Promise with success response
 */
export const deleteGene = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      GENE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete gene with ID ${id}`
    };
  }
};
