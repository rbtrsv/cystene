'use client';

import {
  DataSourceResponse,
  DataSourcesResponse,
  CreateDataSource,
  UpdateDataSource,
  CreateDataSourceSchema,
  UpdateDataSourceSchema,
} from '../../schemas/user/data-source.schemas';
import { DATA_SOURCE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing data sources
 */
export interface ListDataSourcesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all data sources
 * @param params Optional query parameters for pagination
 * @returns Promise with data sources response
 */
export const getDataSources = async (params?: ListDataSourcesParams): Promise<DataSourcesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DATA_SOURCE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<DataSourcesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch data sources',
      data: []
    };
  }
};

/**
 * Fetch a specific data source by ID
 * @param id Data source ID
 * @returns Promise with data source response
 */
export const getDataSource = async (id: number): Promise<DataSourceResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DataSourceResponse>(DATA_SOURCE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch data source with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new data source
 * @param data Data source creation data
 * @returns Promise with data source response
 */
export const createDataSource = async (data: CreateDataSource): Promise<DataSourceResponse> => {
  // Validate request data
  CreateDataSourceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DataSourceResponse>(DATA_SOURCE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create data source',
      data: undefined
    };
  }
};

/**
 * Update an existing data source
 * @param id Data source ID
 * @param data Data source update data
 * @returns Promise with data source response
 */
export const updateDataSource = async (id: number, data: UpdateDataSource): Promise<DataSourceResponse> => {
  // Validate request data
  UpdateDataSourceSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DataSourceResponse>(DATA_SOURCE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update data source with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a data source
 * @param id Data source ID
 * @returns Promise with success response
 */
export const deleteDataSource = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DATA_SOURCE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete data source with ID ${id}`
    };
  }
};
