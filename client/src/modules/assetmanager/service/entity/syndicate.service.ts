'use client';

import {
  SyndicateResponse,
  SyndicatesResponse,
  CreateSyndicate,
  UpdateSyndicate,
  CreateSyndicateSchema,
  UpdateSyndicateSchema,
} from '../../schemas/entity/syndicate.schemas';
import { SYNDICATE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing syndicates
 */
export interface ListSyndicatesParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all syndicates user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with syndicates response
 */
export const getSyndicates = async (params?: ListSyndicatesParams): Promise<SyndicatesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SYNDICATE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicatesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch syndicates',
      data: []
    };
  }
};

/**
 * Fetch a specific syndicate by ID
 * @param id Syndicate ID
 * @returns Promise with syndicate response
 */
export const getSyndicate = async (id: number): Promise<SyndicateResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateResponse>(SYNDICATE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch syndicate with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new syndicate
 * @param data Syndicate creation data
 * @returns Promise with syndicate response
 */
export const createSyndicate = async (data: CreateSyndicate): Promise<SyndicateResponse> => {
  // Validate request data
  CreateSyndicateSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateResponse>(SYNDICATE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create syndicate',
      data: undefined
    };
  }
};

/**
 * Update an existing syndicate
 * @param id Syndicate ID
 * @param data Syndicate update data
 * @returns Promise with syndicate response
 */
export const updateSyndicate = async (id: number, data: UpdateSyndicate): Promise<SyndicateResponse> => {
  // Validate request data
  UpdateSyndicateSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateResponse>(SYNDICATE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update syndicate with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a syndicate
 * @param id Syndicate ID
 * @returns Promise with success response
 */
export const deleteSyndicate = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SYNDICATE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete syndicate with ID ${id}`
    };
  }
};
