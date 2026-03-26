'use client';

import {
  SecurityTransactionResponse,
  SecurityTransactionsResponse,
  CreateSecurityTransaction,
  UpdateSecurityTransaction,
  CreateSecurityTransactionSchema,
  UpdateSecurityTransactionSchema,
  TransactionType,
} from '../../schemas/captable/security-transaction.schemas';
import { SECURITY_TRANSACTION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing security transactions
 * Matches backend subrouter query params
 */
export interface ListSecurityTransactionsParams {
  entity_id?: number;
  stakeholder_id?: number;
  funding_round_id?: number;
  security_id?: number;
  transaction_type?: TransactionType;
  transaction_reference?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  limit?: number;
  offset?: number;
}

/**
 * Fetch all security transactions user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with security transactions response
 */
export const getSecurityTransactions = async (params?: ListSecurityTransactionsParams): Promise<SecurityTransactionsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.stakeholder_id) queryParams.append('stakeholder_id', params.stakeholder_id.toString());
    if (params?.funding_round_id) queryParams.append('funding_round_id', params.funding_round_id.toString());
    if (params?.security_id) queryParams.append('security_id', params.security_id.toString());
    if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
    if (params?.transaction_reference) queryParams.append('transaction_reference', params.transaction_reference);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SECURITY_TRANSACTION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityTransactionsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch security transactions',
      data: []
    };
  }
};

/**
 * Fetch a specific security transaction by ID
 * @param id Security transaction ID
 * @returns Promise with security transaction response
 */
export const getSecurityTransaction = async (id: number): Promise<SecurityTransactionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityTransactionResponse>(SECURITY_TRANSACTION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch security transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new security transaction
 * @param data Security transaction creation data
 * @returns Promise with security transaction response
 */
export const createSecurityTransaction = async (data: CreateSecurityTransaction): Promise<SecurityTransactionResponse> => {
  // Validate request data
  CreateSecurityTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityTransactionResponse>(SECURITY_TRANSACTION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create security transaction',
      data: undefined
    };
  }
};

/**
 * Update an existing security transaction
 * @param id Security transaction ID
 * @param data Security transaction update data
 * @returns Promise with security transaction response
 */
export const updateSecurityTransaction = async (id: number, data: UpdateSecurityTransaction): Promise<SecurityTransactionResponse> => {
  // Validate request data
  UpdateSecurityTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityTransactionResponse>(SECURITY_TRANSACTION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update security transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a security transaction
 * @param id Security transaction ID
 * @returns Promise with success response
 */
export const deleteSecurityTransaction = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SECURITY_TRANSACTION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete security transaction with ID ${id}`
    };
  }
};
