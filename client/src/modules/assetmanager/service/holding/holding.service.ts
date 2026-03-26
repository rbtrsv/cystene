'use client';

import {
  HoldingResponse,
  HoldingsResponse,
  CreateHolding,
  UpdateHolding,
  CreateHoldingSchema,
  UpdateHoldingSchema,
} from '../../schemas/holding/holding.schemas';
import { HOLDING_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing holdings
 */
export interface ListHoldingsParams {
  entity_id?: number;
  investment_status?: string;
  listing_status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all holdings user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with holdings response
 */
export const getHoldings = async (params?: ListHoldingsParams): Promise<HoldingsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.investment_status) queryParams.append('investment_status', params.investment_status.toString());
    if (params?.listing_status) queryParams.append('listing_status', params.listing_status.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${HOLDING_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holdings',
      data: [],
    };
  }
};

/**
 * Fetch a specific holding by ID
 * @param id Holding ID
 * @returns Promise with holding response
 */
export const getHolding = async (id: number): Promise<HoldingResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingResponse>(HOLDING_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch holding with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new holding
 * @param data Holding creation data
 * @returns Promise with holding response
 */
export const createHolding = async (data: CreateHolding): Promise<HoldingResponse> => {
  // Validate request data
  CreateHoldingSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingResponse>(HOLDING_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create holding',
      data: undefined,
    };
  }
};

/**
 * Update an existing holding
 * @param id Holding ID
 * @param data Holding update data
 * @returns Promise with holding response
 */
export const updateHolding = async (id: number, data: UpdateHolding): Promise<HoldingResponse> => {
  // Validate request data
  UpdateHoldingSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingResponse>(HOLDING_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update holding with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a holding
 * @param id Holding ID
 * @returns Promise with success response
 */
export const deleteHolding = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      HOLDING_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete holding with ID ${id}`,
    };
  }
};
