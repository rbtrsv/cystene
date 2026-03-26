'use client';

import {
  BalanceSheetResponse,
  BalanceSheetsResponse,
  CreateBalanceSheet,
  UpdateBalanceSheet,
  CreateBalanceSheetSchema,
  UpdateBalanceSheetSchema,
} from '../../schemas/financial/balance-sheet.schemas';
import { BALANCE_SHEET_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing balance sheets
 */
export interface ListBalanceSheetsParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all balance sheets user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with balance sheets response
 */
export const getBalanceSheets = async (params?: ListBalanceSheetsParams): Promise<BalanceSheetsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id!.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${BALANCE_SHEET_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BalanceSheetsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch balance sheets',
      data: [],
    };
  }
};

/**
 * Fetch a specific balance sheet by ID
 * @param id BalanceSheet ID
 * @returns Promise with balance sheet response
 */
export const getBalanceSheet = async (id: number): Promise<BalanceSheetResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BalanceSheetResponse>(BALANCE_SHEET_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch balance sheet with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new balance sheet
 * @param data BalanceSheet creation data
 * @returns Promise with balance sheet response
 */
export const createBalanceSheet = async (data: CreateBalanceSheet): Promise<BalanceSheetResponse> => {
  // Validate request data
  CreateBalanceSheetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BalanceSheetResponse>(BALANCE_SHEET_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create balance sheet',
      data: undefined,
    };
  }
};

/**
 * Update an existing balance sheet
 * @param id BalanceSheet ID
 * @param data BalanceSheet update data
 * @returns Promise with balance sheet response
 */
export const updateBalanceSheet = async (id: number, data: UpdateBalanceSheet): Promise<BalanceSheetResponse> => {
  // Validate request data
  UpdateBalanceSheetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<BalanceSheetResponse>(BALANCE_SHEET_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update balance sheet with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a balance sheet
 * @param id BalanceSheet ID
 * @returns Promise with success response
 */
export const deleteBalanceSheet = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(BALANCE_SHEET_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete balance sheet with ID ${id}`,
    };
  }
};
