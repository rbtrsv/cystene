'use client';

import {
  SecurityResponse,
  SecuritiesResponse,
  CreateSecurity,
  UpdateSecurity,
  CreateSecuritySchema,
  UpdateSecuritySchema,
  SecurityType,
} from '../../schemas/captable/security.schemas';
import { SECURITY_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing securities
 * Matches backend subrouter query params
 */
export interface ListSecuritiesParams {
  funding_round_id?: number;
  security_type?: SecurityType;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all securities user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with securities response
 */
export const getSecurities = async (params?: ListSecuritiesParams): Promise<SecuritiesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.funding_round_id) queryParams.append('funding_round_id', params.funding_round_id.toString());
    if (params?.security_type) queryParams.append('security_type', params.security_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SECURITY_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecuritiesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch securities',
      data: []
    };
  }
};

/**
 * Fetch a specific security by ID
 * @param id Security ID
 * @returns Promise with security response
 */
export const getSecurity = async (id: number): Promise<SecurityResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityResponse>(SECURITY_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch security with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new security
 * @param data Security creation data
 * @returns Promise with security response
 */
export const createSecurity = async (data: CreateSecurity): Promise<SecurityResponse> => {
  // Validate request data
  CreateSecuritySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityResponse>(SECURITY_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create security',
      data: undefined
    };
  }
};

/**
 * Update an existing security
 * @param id Security ID
 * @param data Security update data
 * @returns Promise with security response
 */
export const updateSecurity = async (id: number, data: UpdateSecurity): Promise<SecurityResponse> => {
  // Validate request data
  UpdateSecuritySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SecurityResponse>(SECURITY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update security with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a security
 * @param id Security ID
 * @returns Promise with success response
 */
export const deleteSecurity = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SECURITY_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete security with ID ${id}`
    };
  }
};
