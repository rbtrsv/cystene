'use client';

import {
  KPIValueResponse,
  KPIValuesResponse,
  CreateKPIValue,
  UpdateKPIValue,
  CreateKPIValueSchema,
  UpdateKPIValueSchema,
} from '../../schemas/financial/kpi-value.schemas';
import { KPI_VALUE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing KPI values
 */
export interface ListKPIValuesParams {
  kpi_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all KPI values user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with KPI values response
 */
export const getKPIValues = async (params?: ListKPIValuesParams): Promise<KPIValuesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.kpi_id) queryParams.append('kpi_id', params.kpi_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${KPI_VALUE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIValuesResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KPI values',
      data: [],
    };
  }
};

/**
 * Fetch a specific KPI value by ID
 * @param id KPIValue ID
 * @returns Promise with KPI value response
 */
export const getKPIValue = async (id: number): Promise<KPIValueResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIValueResponse>(KPI_VALUE_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch KPI value with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new KPI value
 * @param data KPIValue creation data
 * @returns Promise with KPI value response
 */
export const createKPIValue = async (data: CreateKPIValue): Promise<KPIValueResponse> => {
  // Validate request data
  CreateKPIValueSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIValueResponse>(KPI_VALUE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create KPI value',
      data: undefined,
    };
  }
};

/**
 * Update an existing KPI value
 * @param id KPIValue ID
 * @param data KPIValue update data
 * @returns Promise with KPI value response
 */
export const updateKPIValue = async (id: number, data: UpdateKPIValue): Promise<KPIValueResponse> => {
  // Validate request data
  UpdateKPIValueSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIValueResponse>(KPI_VALUE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update KPI value with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a KPI value
 * @param id KPIValue ID
 * @returns Promise with success response
 */
export const deleteKPIValue = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(KPI_VALUE_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete KPI value with ID ${id}`,
    };
  }
};
