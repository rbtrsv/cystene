'use client';

import {
  IndicationResponse,
  IndicationsResponse,
  CreateIndication,
  UpdateIndication,
  CreateIndicationSchema,
  UpdateIndicationSchema,
} from '../../schemas/clinical/indication.schemas';
import { INDICATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing indications
 */
export interface ListIndicationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all indications
 * @param params Optional query parameters for pagination
 * @returns Promise with indications response
 */
export const getIndications = async (params?: ListIndicationsParams): Promise<IndicationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${INDICATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<IndicationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch indications',
      data: []
    };
  }
};

/**
 * Fetch a specific indication by ID
 * @param id Indication ID
 * @returns Promise with indication response
 */
export const getIndication = async (id: number): Promise<IndicationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IndicationResponse>(INDICATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch indication with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new indication
 * @param data Indication creation data
 * @returns Promise with indication response
 */
export const createIndication = async (data: CreateIndication): Promise<IndicationResponse> => {
  // Validate request data
  CreateIndicationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IndicationResponse>(INDICATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create indication',
      data: undefined
    };
  }
};

/**
 * Update an existing indication
 * @param id Indication ID
 * @param data Indication update data
 * @returns Promise with indication response
 */
export const updateIndication = async (id: number, data: UpdateIndication): Promise<IndicationResponse> => {
  // Validate request data
  UpdateIndicationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IndicationResponse>(INDICATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update indication with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an indication
 * @param id Indication ID
 * @returns Promise with success response
 */
export const deleteIndication = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      INDICATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete indication with ID ${id}`
    };
  }
};
