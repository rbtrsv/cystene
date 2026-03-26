'use client';

import {
  UnitOfMeasureResponse,
  UnitOfMeasuresResponse,
  CreateUnitOfMeasure,
  UpdateUnitOfMeasure,
  CreateUnitOfMeasureSchema,
  UpdateUnitOfMeasureSchema,
} from '../../schemas/standardization/unit-of-measure.schemas';
import { UNIT_OF_MEASURE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing units of measure
 */
export interface ListUnitsOfMeasureParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all units of measure
 * @param params Optional query parameters for pagination
 * @returns Promise with units of measure response
 */
export const getUnitsOfMeasure = async (params?: ListUnitsOfMeasureParams): Promise<UnitOfMeasuresResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${UNIT_OF_MEASURE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<UnitOfMeasuresResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch units of measure',
      data: []
    };
  }
};

/**
 * Fetch a specific unit of measure by ID
 * @param id Unit of measure ID
 * @returns Promise with unit of measure response
 */
export const getUnitOfMeasure = async (id: number): Promise<UnitOfMeasureResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UnitOfMeasureResponse>(UNIT_OF_MEASURE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch unit of measure with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new unit of measure
 * @param data Unit of measure creation data
 * @returns Promise with unit of measure response
 */
export const createUnitOfMeasure = async (data: CreateUnitOfMeasure): Promise<UnitOfMeasureResponse> => {
  // Validate request data
  CreateUnitOfMeasureSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UnitOfMeasureResponse>(UNIT_OF_MEASURE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create unit of measure',
      data: undefined
    };
  }
};

/**
 * Update an existing unit of measure
 * @param id Unit of measure ID
 * @param data Unit of measure update data
 * @returns Promise with unit of measure response
 */
export const updateUnitOfMeasure = async (id: number, data: UpdateUnitOfMeasure): Promise<UnitOfMeasureResponse> => {
  // Validate request data
  UpdateUnitOfMeasureSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UnitOfMeasureResponse>(UNIT_OF_MEASURE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update unit of measure with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a unit of measure
 * @param id Unit of measure ID
 * @returns Promise with success response
 */
export const deleteUnitOfMeasure = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      UNIT_OF_MEASURE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete unit of measure with ID ${id}`
    };
  }
};
