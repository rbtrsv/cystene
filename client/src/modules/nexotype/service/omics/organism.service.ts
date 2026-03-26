'use client';

import {
  OrganismResponse,
  OrganismsResponse,
  CreateOrganism,
  UpdateOrganism,
  CreateOrganismSchema,
  UpdateOrganismSchema,
} from '../../schemas/omics/organism.schemas';
import { ORGANISM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing organisms
 */
export interface ListOrganismsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all organisms
 * @param params Optional query parameters for pagination
 * @returns Promise with organisms response
 */
export const getOrganisms = async (params?: ListOrganismsParams): Promise<OrganismsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ORGANISM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<OrganismsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch organisms',
      data: []
    };
  }
};

/**
 * Fetch a specific organism by ID
 * @param id Organism ID
 * @returns Promise with organism response
 */
export const getOrganism = async (id: number): Promise<OrganismResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganismResponse>(ORGANISM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch organism with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new organism
 * @param data Organism creation data
 * @returns Promise with organism response
 */
export const createOrganism = async (data: CreateOrganism): Promise<OrganismResponse> => {
  // Validate request data
  CreateOrganismSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganismResponse>(ORGANISM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create organism',
      data: undefined
    };
  }
};

/**
 * Update an existing organism
 * @param id Organism ID
 * @param data Organism update data
 * @returns Promise with organism response
 */
export const updateOrganism = async (id: number, data: UpdateOrganism): Promise<OrganismResponse> => {
  // Validate request data
  UpdateOrganismSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganismResponse>(ORGANISM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update organism with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an organism
 * @param id Organism ID
 * @returns Promise with success response
 */
export const deleteOrganism = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ORGANISM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete organism with ID ${id}`
    };
  }
};
