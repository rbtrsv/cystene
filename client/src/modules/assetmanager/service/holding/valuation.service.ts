'use client';

import {
  ValuationResponse,
  ValuationsResponse,
  CreateValuation,
  UpdateValuation,
  CreateValuationSchema,
  UpdateValuationSchema,
} from '../../schemas/holding/valuation.schemas';
import { VALUATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing valuations
 */
export interface ListValuationsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all valuations user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with valuations response
 */
export const getValuations = async (params?: ListValuationsParams): Promise<ValuationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${VALUATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ValuationsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch valuations',
      data: [],
    };
  }
};

/**
 * Fetch a specific valuation by ID
 * @param id Valuation ID
 * @returns Promise with valuation response
 */
export const getValuation = async (id: number): Promise<ValuationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ValuationResponse>(VALUATION_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch valuation with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new valuation
 * @param data Valuation creation data
 * @returns Promise with valuation response
 */
export const createValuation = async (data: CreateValuation): Promise<ValuationResponse> => {
  // Validate request data
  CreateValuationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ValuationResponse>(VALUATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create valuation',
      data: undefined,
    };
  }
};

/**
 * Update an existing valuation
 * @param id Valuation ID
 * @param data Valuation update data
 * @returns Promise with valuation response
 */
export const updateValuation = async (id: number, data: UpdateValuation): Promise<ValuationResponse> => {
  // Validate request data
  UpdateValuationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ValuationResponse>(VALUATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update valuation with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a valuation
 * @param id Valuation ID
 * @returns Promise with success response
 */
export const deleteValuation = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      VALUATION_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete valuation with ID ${id}`,
    };
  }
};
