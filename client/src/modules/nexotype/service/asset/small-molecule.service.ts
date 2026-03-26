'use client';

import {
  SmallMoleculeResponse,
  SmallMoleculesResponse,
  CreateSmallMolecule,
  UpdateSmallMolecule,
  CreateSmallMoleculeSchema,
  UpdateSmallMoleculeSchema,
} from '../../schemas/asset/small-molecule.schemas';
import { SMALL_MOLECULE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing small molecules
 */
export interface ListSmallMoleculesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all small molecules
 * @param params Optional query parameters for pagination
 * @returns Promise with small molecules response
 */
export const getSmallMolecules = async (params?: ListSmallMoleculesParams): Promise<SmallMoleculesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SMALL_MOLECULE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<SmallMoleculesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch small molecules',
      data: []
    };
  }
};

/**
 * Fetch a specific small molecule by ID
 * @param id Small molecule ID
 * @returns Promise with small molecule response
 */
export const getSmallMolecule = async (id: number): Promise<SmallMoleculeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SmallMoleculeResponse>(SMALL_MOLECULE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch small molecule with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new small molecule
 * @param data Small molecule creation data
 * @returns Promise with small molecule response
 */
export const createSmallMolecule = async (data: CreateSmallMolecule): Promise<SmallMoleculeResponse> => {
  // Validate request data
  CreateSmallMoleculeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SmallMoleculeResponse>(SMALL_MOLECULE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create small molecule',
      data: undefined
    };
  }
};

/**
 * Update an existing small molecule
 * @param id Small molecule ID
 * @param data Small molecule update data
 * @returns Promise with small molecule response
 */
export const updateSmallMolecule = async (id: number, data: UpdateSmallMolecule): Promise<SmallMoleculeResponse> => {
  // Validate request data
  UpdateSmallMoleculeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SmallMoleculeResponse>(SMALL_MOLECULE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update small molecule with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a small molecule
 * @param id Small molecule ID
 * @returns Promise with success response
 */
export const deleteSmallMolecule = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SMALL_MOLECULE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete small molecule with ID ${id}`
    };
  }
};
