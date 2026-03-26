'use client';

import {
  IncomeStatementResponse,
  IncomeStatementsResponse,
  CreateIncomeStatement,
  UpdateIncomeStatement,
  CreateIncomeStatementSchema,
  UpdateIncomeStatementSchema,
} from '../../schemas/financial/income-statement.schemas';
import { INCOME_STATEMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing income statements
 */
export interface ListIncomeStatementsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all income statements user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with income statements response
 */
export const getIncomeStatements = async (params?: ListIncomeStatementsParams): Promise<IncomeStatementsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${INCOME_STATEMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IncomeStatementsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch income statements',
      data: [],
    };
  }
};

/**
 * Fetch a specific income statement by ID
 * @param id IncomeStatement ID
 * @returns Promise with income statement response
 */
export const getIncomeStatement = async (id: number): Promise<IncomeStatementResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IncomeStatementResponse>(INCOME_STATEMENT_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch income statement with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new income statement
 * @param data IncomeStatement creation data
 * @returns Promise with income statement response
 */
export const createIncomeStatement = async (data: CreateIncomeStatement): Promise<IncomeStatementResponse> => {
  // Validate request data
  CreateIncomeStatementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IncomeStatementResponse>(INCOME_STATEMENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create income statement',
      data: undefined,
    };
  }
};

/**
 * Update an existing income statement
 * @param id IncomeStatement ID
 * @param data IncomeStatement update data
 * @returns Promise with income statement response
 */
export const updateIncomeStatement = async (id: number, data: UpdateIncomeStatement): Promise<IncomeStatementResponse> => {
  // Validate request data
  UpdateIncomeStatementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<IncomeStatementResponse>(INCOME_STATEMENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update income statement with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete an income statement
 * @param id IncomeStatement ID
 * @returns Promise with success response
 */
export const deleteIncomeStatement = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(INCOME_STATEMENT_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete income statement with ID ${id}`,
    };
  }
};
