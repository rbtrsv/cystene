'use client';

import {
  HoldingPerformanceResponse,
  HoldingPerformancesResponse,
  CreateHoldingPerformance,
  UpdateHoldingPerformance,
  CreateHoldingPerformanceSchema,
  UpdateHoldingPerformanceSchema,
} from '../../schemas/holding/holding-performance.schemas';
import { HOLDING_PERFORMANCE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing holding performances
 */
export interface ListHoldingPerformancesParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all holding performance records user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with holding performances response
 */
export const getHoldingPerformances = async (params?: ListHoldingPerformancesParams): Promise<HoldingPerformancesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${HOLDING_PERFORMANCE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingPerformancesResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holding performance records',
      data: [],
    };
  }
};

/**
 * Fetch a specific holding performance record by ID
 * @param id Holding performance ID
 * @returns Promise with holding performance response
 */
export const getHoldingPerformance = async (id: number): Promise<HoldingPerformanceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingPerformanceResponse>(HOLDING_PERFORMANCE_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch holding performance record with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new holding performance record
 * @param data Holding performance creation data
 * @returns Promise with holding performance response
 */
export const createHoldingPerformance = async (data: CreateHoldingPerformance): Promise<HoldingPerformanceResponse> => {
  // Validate request data
  CreateHoldingPerformanceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingPerformanceResponse>(HOLDING_PERFORMANCE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create holding performance record',
      data: undefined,
    };
  }
};

/**
 * Update an existing holding performance record
 * @param id Holding performance ID
 * @param data Holding performance update data
 * @returns Promise with holding performance response
 */
export const updateHoldingPerformance = async (id: number, data: UpdateHoldingPerformance): Promise<HoldingPerformanceResponse> => {
  // Validate request data
  UpdateHoldingPerformanceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingPerformanceResponse>(HOLDING_PERFORMANCE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update holding performance record with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a holding performance record
 * @param id Holding performance ID
 * @returns Promise with success response
 */
export const deleteHoldingPerformance = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      HOLDING_PERFORMANCE_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete holding performance record with ID ${id}`,
    };
  }
};
