'use client';

import {
  BiologicalRelationshipResponse,
  BiologicalRelationshipsResponse,
  CreateBiologicalRelationship,
  UpdateBiologicalRelationship,
  CreateBiologicalRelationshipSchema,
  UpdateBiologicalRelationshipSchema,
} from '../../schemas/knowledge_graph/biological-relationship.schemas';
import { BIOLOGICAL_RELATIONSHIP_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing biological relationships
 */
export interface ListBiologicalRelationshipsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all biological relationships
 * @param params Optional query parameters for pagination
 * @returns Promise with biological relationships response
 */
export const getBiologicalRelationships = async (params?: ListBiologicalRelationshipsParams): Promise<BiologicalRelationshipsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BIOLOGICAL_RELATIONSHIP_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<BiologicalRelationshipsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch biological relationships',
      data: []
    };
  }
};

/**
 * Fetch a specific biological relationship by ID
 * @param id BiologicalRelationship ID
 * @returns Promise with biological relationship response
 */
export const getBiologicalRelationship = async (id: number): Promise<BiologicalRelationshipResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicalRelationshipResponse>(BIOLOGICAL_RELATIONSHIP_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch biological relationship with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new biological relationship
 * @param data BiologicalRelationship creation data
 * @returns Promise with biological relationship response
 */
export const createBiologicalRelationship = async (data: CreateBiologicalRelationship): Promise<BiologicalRelationshipResponse> => {
  // Validate request data
  CreateBiologicalRelationshipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicalRelationshipResponse>(BIOLOGICAL_RELATIONSHIP_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create biological relationship',
      data: undefined
    };
  }
};

/**
 * Update an existing biological relationship
 * @param id BiologicalRelationship ID
 * @param data BiologicalRelationship update data
 * @returns Promise with biological relationship response
 */
export const updateBiologicalRelationship = async (id: number, data: UpdateBiologicalRelationship): Promise<BiologicalRelationshipResponse> => {
  // Validate request data
  UpdateBiologicalRelationshipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BiologicalRelationshipResponse>(BIOLOGICAL_RELATIONSHIP_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update biological relationship with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a biological relationship
 * @param id BiologicalRelationship ID
 * @returns Promise with success response
 */
export const deleteBiologicalRelationship = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      BIOLOGICAL_RELATIONSHIP_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete biological relationship with ID ${id}`
    };
  }
};
