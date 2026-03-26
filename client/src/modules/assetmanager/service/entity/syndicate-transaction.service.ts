'use client';

import {
  SyndicateTransactionResponse,
  SyndicateTransactionsResponse,
  CreateSyndicateTransaction,
  UpdateSyndicateTransaction,
  CreateSyndicateTransactionSchema,
  UpdateSyndicateTransactionSchema,
} from '../../schemas/entity/syndicate-transaction.schemas';
import { SYNDICATE_TRANSACTION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing syndicate transactions
 */
export interface ListSyndicateTransactionsParams {
  syndicate_id?: number;
  seller_entity_id?: number;
  buyer_entity_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all syndicate transactions
 * @param params Optional query parameters for filtering
 * @returns Promise with syndicate transactions response
 */
export const getSyndicateTransactions = async (
  params?: ListSyndicateTransactionsParams
): Promise<SyndicateTransactionsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.syndicate_id) queryParams.append('syndicate_id', params.syndicate_id.toString());
    if (params?.seller_entity_id) queryParams.append('seller_entity_id', params.seller_entity_id.toString());
    if (params?.buyer_entity_id) queryParams.append('buyer_entity_id', params.buyer_entity_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SYNDICATE_TRANSACTION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateTransactionsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch syndicate transactions',
      data: []
    };
  }
};

/**
 * Fetch a specific syndicate transaction by ID
 * @param id Syndicate transaction ID
 * @returns Promise with syndicate transaction response
 */
export const getSyndicateTransaction = async (id: number): Promise<SyndicateTransactionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateTransactionResponse>(
      SYNDICATE_TRANSACTION_ENDPOINTS.DETAIL(id),
      {
        method: 'GET'
      }
    );

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch syndicate transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new syndicate transaction
 * @param data Syndicate transaction creation data
 * @returns Promise with syndicate transaction response
 */
export const createSyndicateTransaction = async (
  data: CreateSyndicateTransaction
): Promise<SyndicateTransactionResponse> => {
  // Validate request data
  CreateSyndicateTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateTransactionResponse>(
      SYNDICATE_TRANSACTION_ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create syndicate transaction',
      data: undefined
    };
  }
};

/**
 * Update an existing syndicate transaction
 * @param id Syndicate transaction ID
 * @param data Syndicate transaction update data
 * @returns Promise with syndicate transaction response
 */
export const updateSyndicateTransaction = async (
  id: number,
  data: UpdateSyndicateTransaction
): Promise<SyndicateTransactionResponse> => {
  // Validate request data
  UpdateSyndicateTransactionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateTransactionResponse>(
      SYNDICATE_TRANSACTION_ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update syndicate transaction with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a syndicate transaction
 * @param id Syndicate transaction ID
 * @returns Promise with success response
 */
export const deleteSyndicateTransaction = async (
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SYNDICATE_TRANSACTION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete syndicate transaction with ID ${id}`
    };
  }
};
