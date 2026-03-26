'use client';

import {
  TransactionResponse,
  TransactionsResponse,
  CreateTransaction,
  UpdateTransaction,
  CreateTransactionSchema,
  UpdateTransactionSchema,
} from '../../schemas/commercial/transaction.schemas';
import { TRANSACTION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing transactions
 */
export interface ListTransactionsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all transactions
 * @param params Optional query parameters for pagination
 * @returns Promise with transactions response
 */
export const getTransactions = async (params?: ListTransactionsParams): Promise<TransactionsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${TRANSACTION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TransactionsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      data: []
    };
  }
};

/**
 * Fetch a specific transaction by ID
 * @param id Transaction ID
 * @returns Promise with transaction response
 */
export const getTransaction = async (id: number): Promise<TransactionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TransactionResponse>(TRANSACTION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new transaction
 * @param data Transaction creation data
 * @returns Promise with transaction response
 */
export const createTransaction = async (data: CreateTransaction): Promise<TransactionResponse> => {
  // Validate request data
  CreateTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TransactionResponse>(TRANSACTION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
      data: undefined
    };
  }
};

/**
 * Update an existing transaction
 * @param id Transaction ID
 * @param data Transaction update data
 * @returns Promise with transaction response
 */
export const updateTransaction = async (id: number, data: UpdateTransaction): Promise<TransactionResponse> => {
  // Validate request data
  UpdateTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TransactionResponse>(TRANSACTION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a transaction
 * @param id Transaction ID
 * @returns Promise with success response
 */
export const deleteTransaction = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      TRANSACTION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete transaction with ID ${id}`
    };
  }
};
