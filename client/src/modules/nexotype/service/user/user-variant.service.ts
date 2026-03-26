'use client';

import {
  UserVariantResponse,
  UserVariantsResponse,
  CreateUserVariant,
  UpdateUserVariant,
  CreateUserVariantSchema,
  UpdateUserVariantSchema,
} from '../../schemas/user/user-variant.schemas';
import { USER_VARIANT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing user variants
 */
export interface ListUserVariantsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all user variants
 * @param params Optional query parameters for pagination
 * @returns Promise with user variants response
 */
export const getUserVariants = async (params?: ListUserVariantsParams): Promise<UserVariantsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${USER_VARIANT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<UserVariantsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch user variants',
      data: []
    };
  }
};

/**
 * Fetch a specific user variant by ID
 * @param id User variant ID
 * @returns Promise with user variant response
 */
export const getUserVariant = async (id: number): Promise<UserVariantResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserVariantResponse>(USER_VARIANT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch user variant with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new user variant
 * @param data User variant creation data
 * @returns Promise with user variant response
 */
export const createUserVariant = async (data: CreateUserVariant): Promise<UserVariantResponse> => {
  // Validate request data
  CreateUserVariantSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserVariantResponse>(USER_VARIANT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user variant',
      data: undefined
    };
  }
};

/**
 * Update an existing user variant
 * @param id User variant ID
 * @param data User variant update data
 * @returns Promise with user variant response
 */
export const updateUserVariant = async (id: number, data: UpdateUserVariant): Promise<UserVariantResponse> => {
  // Validate request data
  UpdateUserVariantSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserVariantResponse>(USER_VARIANT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update user variant with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a user variant
 * @param id User variant ID
 * @returns Promise with success response
 */
export const deleteUserVariant = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      USER_VARIANT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete user variant with ID ${id}`
    };
  }
};
