'use client';

import {
  DesignMutationResponse,
  DesignMutationsResponse,
  CreateDesignMutation,
  UpdateDesignMutation,
  CreateDesignMutationSchema,
  UpdateDesignMutationSchema,
} from '../../schemas/engineering/design-mutation.schemas';
import { DESIGN_MUTATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing design mutations
 */
export interface ListDesignMutationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all design mutations
 * @param params Optional query parameters for pagination
 * @returns Promise with design mutations response
 */
export const getDesignMutations = async (params?: ListDesignMutationsParams): Promise<DesignMutationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DESIGN_MUTATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<DesignMutationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch design mutations',
      data: []
    };
  }
};

/**
 * Fetch a specific design mutation by ID
 * @param id Design mutation ID
 * @returns Promise with design mutation response
 */
export const getDesignMutation = async (id: number): Promise<DesignMutationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DesignMutationResponse>(DESIGN_MUTATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch design mutation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new design mutation
 * @param data Design mutation creation data
 * @returns Promise with design mutation response
 */
export const createDesignMutation = async (data: CreateDesignMutation): Promise<DesignMutationResponse> => {
  // Validate request data
  CreateDesignMutationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DesignMutationResponse>(DESIGN_MUTATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create design mutation',
      data: undefined
    };
  }
};

/**
 * Update an existing design mutation
 * @param id Design mutation ID
 * @param data Design mutation update data
 * @returns Promise with design mutation response
 */
export const updateDesignMutation = async (id: number, data: UpdateDesignMutation): Promise<DesignMutationResponse> => {
  // Validate request data
  UpdateDesignMutationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DesignMutationResponse>(DESIGN_MUTATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update design mutation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a design mutation
 * @param id Design mutation ID
 * @returns Promise with success response
 */
export const deleteDesignMutation = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DESIGN_MUTATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete design mutation with ID ${id}`
    };
  }
};
