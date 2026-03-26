'use client';

import {
  CashFlowStatementResponse,
  CashFlowStatementsResponse,
  CreateCashFlowStatement,
  UpdateCashFlowStatement,
  CreateCashFlowStatementSchema,
  UpdateCashFlowStatementSchema,
} from '../../schemas/financial/cash-flow-statement.schemas';
import { CASH_FLOW_STATEMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing cash flow statements
 */
export interface ListCashFlowStatementsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all cash flow statements user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with cash flow statements response
 */
export const getCashFlowStatements = async (params?: ListCashFlowStatementsParams): Promise<CashFlowStatementsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${CASH_FLOW_STATEMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CashFlowStatementsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch cash flow statements',
      data: [],
    };
  }
};

/**
 * Fetch a specific cash flow statement by ID
 * @param id CashFlowStatement ID
 * @returns Promise with cash flow statement response
 */
export const getCashFlowStatement = async (id: number): Promise<CashFlowStatementResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CashFlowStatementResponse>(CASH_FLOW_STATEMENT_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch cash flow statement with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new cash flow statement
 * @param data CashFlowStatement creation data
 * @returns Promise with cash flow statement response
 */
export const createCashFlowStatement = async (data: CreateCashFlowStatement): Promise<CashFlowStatementResponse> => {
  // Validate request data
  CreateCashFlowStatementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CashFlowStatementResponse>(CASH_FLOW_STATEMENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cash flow statement',
      data: undefined,
    };
  }
};

/**
 * Update an existing cash flow statement
 * @param id CashFlowStatement ID
 * @param data CashFlowStatement update data
 * @returns Promise with cash flow statement response
 */
export const updateCashFlowStatement = async (id: number, data: UpdateCashFlowStatement): Promise<CashFlowStatementResponse> => {
  // Validate request data
  UpdateCashFlowStatementSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CashFlowStatementResponse>(CASH_FLOW_STATEMENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update cash flow statement with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a cash flow statement
 * @param id CashFlowStatement ID
 * @returns Promise with success response
 */
export const deleteCashFlowStatement = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(CASH_FLOW_STATEMENT_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete cash flow statement with ID ${id}`,
    };
  }
};
