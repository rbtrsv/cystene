'use client';

/**
 * Infrastructure Service
 *
 * CRUD operations for Infrastructure model.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/infrastructure_subrouter.py
 */

import {
  InfrastructureResponse,
  InfrastructuresResponse,
  CreateInfrastructure,
  UpdateInfrastructure,
  CreateInfrastructureSchema,
  UpdateInfrastructureSchema,
  InfraType,
} from '../../schemas/infrastructure/infrastructure.schemas';
import { INFRASTRUCTURE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing infrastructure
 */
export interface ListInfrastructureParams {
  infra_type?: InfraType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all infrastructure items user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with infrastructure response
 */
export const getInfrastructures = async (params?: ListInfrastructureParams): Promise<InfrastructuresResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.infra_type) queryParams.append('infra_type', params.infra_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${INFRASTRUCTURE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<InfrastructuresResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch infrastructure',
      data: []
    };
  }
};

/**
 * Fetch a specific infrastructure item by ID
 * @param id Infrastructure ID
 * @returns Promise with infrastructure response
 */
export const getInfrastructure = async (id: number): Promise<InfrastructureResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<InfrastructureResponse>(INFRASTRUCTURE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch infrastructure with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new infrastructure item
 * @param data Infrastructure creation data
 * @returns Promise with infrastructure response
 */
export const createInfrastructure = async (data: CreateInfrastructure): Promise<InfrastructureResponse> => {
  // Validate request data
  CreateInfrastructureSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<InfrastructureResponse>(INFRASTRUCTURE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create infrastructure',
      data: undefined
    };
  }
};

/**
 * Update an existing infrastructure item
 * @param id Infrastructure ID
 * @param data Infrastructure update data
 * @returns Promise with infrastructure response
 */
export const updateInfrastructure = async (id: number, data: UpdateInfrastructure): Promise<InfrastructureResponse> => {
  // Validate request data
  UpdateInfrastructureSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<InfrastructureResponse>(INFRASTRUCTURE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update infrastructure with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an infrastructure item (soft delete)
 * @param id Infrastructure ID
 * @returns Promise with success response
 */
export const deleteInfrastructure = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      INFRASTRUCTURE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete infrastructure with ID ${id}`
    };
  }
};
