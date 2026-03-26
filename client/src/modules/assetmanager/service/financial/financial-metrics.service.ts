'use client';

import {
  FinancialMetricsResponse,
  FinancialMetricsListResponse,
  CreateFinancialMetrics,
  UpdateFinancialMetrics,
  CreateFinancialMetricsSchema,
  UpdateFinancialMetricsSchema,
} from '../../schemas/financial/financial-metrics.schemas';
import { FINANCIAL_METRICS_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing financial metrics
 */
export interface ListFinancialMetricsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all financial metrics records user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with financial metrics response
 */
export const getFinancialMetricsList = async (params?: ListFinancialMetricsParams): Promise<FinancialMetricsListResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${FINANCIAL_METRICS_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FinancialMetricsListResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch financial metrics',
      data: [],
    };
  }
};

/**
 * Fetch a specific financial metrics record by ID
 * @param id FinancialMetrics ID
 * @returns Promise with financial metrics response
 */
export const getFinancialMetrics = async (id: number): Promise<FinancialMetricsResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FinancialMetricsResponse>(FINANCIAL_METRICS_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch financial metrics record with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new financial metrics record
 * @param data FinancialMetrics creation data
 * @returns Promise with financial metrics response
 */
export const createFinancialMetrics = async (data: CreateFinancialMetrics): Promise<FinancialMetricsResponse> => {
  // Validate request data
  CreateFinancialMetricsSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FinancialMetricsResponse>(FINANCIAL_METRICS_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create financial metrics record',
      data: undefined,
    };
  }
};

/**
 * Update an existing financial metrics record
 * @param id FinancialMetrics ID
 * @param data FinancialMetrics update data
 * @returns Promise with financial metrics response
 */
export const updateFinancialMetrics = async (id: number, data: UpdateFinancialMetrics): Promise<FinancialMetricsResponse> => {
  // Validate request data
  UpdateFinancialMetricsSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FinancialMetricsResponse>(FINANCIAL_METRICS_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update financial metrics record with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a financial metrics record
 * @param id FinancialMetrics ID
 * @returns Promise with success response
 */
export const deleteFinancialMetrics = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(FINANCIAL_METRICS_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete financial metrics record with ID ${id}`,
    };
  }
};
