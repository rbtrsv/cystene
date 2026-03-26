'use client';

import {
  VariantResponse,
  VariantsResponse,
  CreateVariant,
  UpdateVariant,
  CreateVariantSchema,
  UpdateVariantSchema,
} from '../../schemas/omics/variant.schemas';
import { VARIANT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing variants
 */
export interface ListVariantsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all variants
 * @param params Optional query parameters for pagination
 * @returns Promise with variants response
 */
export const getVariants = async (params?: ListVariantsParams): Promise<VariantsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${VARIANT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<VariantsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch variants',
      data: []
    };
  }
};

/**
 * Fetch a specific variant by ID
 * @param id Variant ID
 * @returns Promise with variant response
 */
export const getVariant = async (id: number): Promise<VariantResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantResponse>(VARIANT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch variant with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new variant
 * @param data Variant creation data
 * @returns Promise with variant response
 */
export const createVariant = async (data: CreateVariant): Promise<VariantResponse> => {
  // Validate request data
  CreateVariantSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantResponse>(VARIANT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create variant',
      data: undefined
    };
  }
};

/**
 * Update an existing variant
 * @param id Variant ID
 * @param data Variant update data
 * @returns Promise with variant response
 */
export const updateVariant = async (id: number, data: UpdateVariant): Promise<VariantResponse> => {
  // Validate request data
  UpdateVariantSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<VariantResponse>(VARIANT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update variant with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a variant
 * @param id Variant ID
 * @returns Promise with success response
 */
export const deleteVariant = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      VARIANT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete variant with ID ${id}`
    };
  }
};
