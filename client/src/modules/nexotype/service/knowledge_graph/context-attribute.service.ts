'use client';

import {
  ContextAttributeResponse,
  ContextAttributesResponse,
  CreateContextAttribute,
  UpdateContextAttribute,
  CreateContextAttributeSchema,
  UpdateContextAttributeSchema,
} from '../../schemas/knowledge_graph/context-attribute.schemas';
import { CONTEXT_ATTRIBUTE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing context attributes
 */
export interface ListContextAttributesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all context attributes
 * @param params Optional query parameters for pagination
 * @returns Promise with context attributes response
 */
export const getContextAttributes = async (params?: ListContextAttributesParams): Promise<ContextAttributesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${CONTEXT_ATTRIBUTE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<ContextAttributesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch context attributes',
      data: []
    };
  }
};

/**
 * Fetch a specific context attribute by ID
 * @param id ContextAttribute ID
 * @returns Promise with context attribute response
 */
export const getContextAttribute = async (id: number): Promise<ContextAttributeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ContextAttributeResponse>(CONTEXT_ATTRIBUTE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch context attribute with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new context attribute
 * @param data ContextAttribute creation data
 * @returns Promise with context attribute response
 */
export const createContextAttribute = async (data: CreateContextAttribute): Promise<ContextAttributeResponse> => {
  // Validate request data
  CreateContextAttributeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ContextAttributeResponse>(CONTEXT_ATTRIBUTE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create context attribute',
      data: undefined
    };
  }
};

/**
 * Update an existing context attribute
 * @param id ContextAttribute ID
 * @param data ContextAttribute update data
 * @returns Promise with context attribute response
 */
export const updateContextAttribute = async (id: number, data: UpdateContextAttribute): Promise<ContextAttributeResponse> => {
  // Validate request data
  UpdateContextAttributeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ContextAttributeResponse>(CONTEXT_ATTRIBUTE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update context attribute with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a context attribute
 * @param id ContextAttribute ID
 * @returns Promise with success response
 */
export const deleteContextAttribute = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      CONTEXT_ATTRIBUTE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete context attribute with ID ${id}`
    };
  }
};
