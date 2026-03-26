'use client';

import {
  FeeResponse,
  FeesResponse,
  CreateFee,
  UpdateFee,
  CreateFeeSchema,
  UpdateFeeSchema,
  FeeType,
  Scenario,
} from '../../schemas/captable/fee.schemas';
import { FEE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing fees
 */
export interface ListFeesParams {
  entity_id?: number;
  funding_round_id?: number;
  fee_type?: FeeType;
  scenario?: Scenario;
  year?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all fees user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with fees response
 */
export const getFees = async (params?: ListFeesParams): Promise<FeesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.funding_round_id) queryParams.append('funding_round_id', params.funding_round_id.toString());
    if (params?.fee_type) queryParams.append('fee_type', params.fee_type);
    if (params?.scenario) queryParams.append('scenario', params.scenario);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${FEE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FeesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch fees',
      data: []
    };
  }
};

/**
 * Fetch a specific fee by ID
 * @param id Fee ID
 * @returns Promise with fee response
 */
export const getFee = async (id: number): Promise<FeeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FeeResponse>(FEE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch fee with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new fee
 * @param data Fee creation data
 * @returns Promise with fee response
 */
export const createFee = async (data: CreateFee): Promise<FeeResponse> => {
  // Validate request data
  CreateFeeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FeeResponse>(FEE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create fee',
      data: undefined
    };
  }
};

/**
 * Update an existing fee
 * @param id Fee ID
 * @param data Fee update data
 * @returns Promise with fee response
 */
export const updateFee = async (id: number, data: UpdateFee): Promise<FeeResponse> => {
  // Validate request data
  UpdateFeeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FeeResponse>(FEE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update fee with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a fee
 * @param id Fee ID
 * @returns Promise with success response
 */
export const deleteFee = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      FEE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete fee with ID ${id}`
    };
  }
};
