'use client';

import {
  GenomicAssociationResponse,
  GenomicAssociationsResponse,
  CreateGenomicAssociation,
  UpdateGenomicAssociation,
  CreateGenomicAssociationSchema,
  UpdateGenomicAssociationSchema,
} from '../../schemas/knowledge_graph/genomic-association.schemas';
import { GENOMIC_ASSOCIATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing genomic associations
 */
export interface ListGenomicAssociationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all genomic associations
 * @param params Optional query parameters for pagination
 * @returns Promise with genomic associations response
 */
export const getGenomicAssociations = async (params?: ListGenomicAssociationsParams): Promise<GenomicAssociationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${GENOMIC_ASSOCIATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<GenomicAssociationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch genomic associations',
      data: []
    };
  }
};

/**
 * Fetch a specific genomic association by ID
 * @param id GenomicAssociation ID
 * @returns Promise with genomic association response
 */
export const getGenomicAssociation = async (id: number): Promise<GenomicAssociationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicAssociationResponse>(GENOMIC_ASSOCIATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch genomic association with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new genomic association
 * @param data GenomicAssociation creation data
 * @returns Promise with genomic association response
 */
export const createGenomicAssociation = async (data: CreateGenomicAssociation): Promise<GenomicAssociationResponse> => {
  // Validate request data
  CreateGenomicAssociationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicAssociationResponse>(GENOMIC_ASSOCIATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create genomic association',
      data: undefined
    };
  }
};

/**
 * Update an existing genomic association
 * @param id GenomicAssociation ID
 * @param data GenomicAssociation update data
 * @returns Promise with genomic association response
 */
export const updateGenomicAssociation = async (id: number, data: UpdateGenomicAssociation): Promise<GenomicAssociationResponse> => {
  // Validate request data
  UpdateGenomicAssociationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicAssociationResponse>(GENOMIC_ASSOCIATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update genomic association with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a genomic association
 * @param id GenomicAssociation ID
 * @returns Promise with success response
 */
export const deleteGenomicAssociation = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      GENOMIC_ASSOCIATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete genomic association with ID ${id}`
    };
  }
};
