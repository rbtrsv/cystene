'use client';

import {
  KPIResponse,
  KPIsResponse,
  CreateKPI,
  UpdateKPI,
  CreateKPISchema,
  UpdateKPISchema,
} from '../../schemas/financial/kpi.schemas';
import { KPI_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing KPIs
 */
export interface ListKPIsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all KPIs user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with KPIs response
 */
export const getKPIs = async (params?: ListKPIsParams): Promise<KPIsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${KPI_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KPIs',
      data: [],
    };
  }
};

/**
 * Fetch a specific KPI by ID
 * @param id KPI ID
 * @returns Promise with KPI response
 */
export const getKPI = async (id: number): Promise<KPIResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIResponse>(KPI_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch KPI with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new KPI
 * @param data KPI creation data
 * @returns Promise with KPI response
 */
export const createKPI = async (data: CreateKPI): Promise<KPIResponse> => {
  // Validate request data
  CreateKPISchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIResponse>(KPI_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create KPI',
      data: undefined,
    };
  }
};

/**
 * Update an existing KPI
 * @param id KPI ID
 * @param data KPI update data
 * @returns Promise with KPI response
 */
export const updateKPI = async (id: number, data: UpdateKPI): Promise<KPIResponse> => {
  // Validate request data
  UpdateKPISchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<KPIResponse>(KPI_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update KPI with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a KPI
 * @param id KPI ID
 * @returns Promise with success response
 */
export const deleteKPI = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(KPI_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete KPI with ID ${id}`,
    };
  }
};
