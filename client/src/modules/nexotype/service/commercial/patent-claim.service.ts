'use client';

import {
  PatentClaimResponse,
  PatentClaimsResponse,
  CreatePatentClaim,
  UpdatePatentClaim,
  CreatePatentClaimSchema,
  UpdatePatentClaimSchema,
} from '../../schemas/commercial/patent-claim.schemas';
import { PATENT_CLAIM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing patent claims
 */
export interface ListPatentClaimsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all patent claims
 * @param params Optional query parameters for pagination
 * @returns Promise with patent claims response
 */
export const getPatentClaims = async (params?: ListPatentClaimsParams): Promise<PatentClaimsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATENT_CLAIM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PatentClaimsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch patent claims',
      data: []
    };
  }
};

/**
 * Fetch a specific patent claim by ID
 * @param id PatentClaim ID
 * @returns Promise with patent claim response
 */
export const getPatentClaim = async (id: number): Promise<PatentClaimResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentClaimResponse>(PATENT_CLAIM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch patent claim with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new patent claim
 * @param data PatentClaim creation data
 * @returns Promise with patent claim response
 */
export const createPatentClaim = async (data: CreatePatentClaim): Promise<PatentClaimResponse> => {
  // Validate request data
  CreatePatentClaimSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentClaimResponse>(PATENT_CLAIM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create patent claim',
      data: undefined
    };
  }
};

/**
 * Update an existing patent claim
 * @param id PatentClaim ID
 * @param data PatentClaim update data
 * @returns Promise with patent claim response
 */
export const updatePatentClaim = async (id: number, data: UpdatePatentClaim): Promise<PatentClaimResponse> => {
  // Validate request data
  UpdatePatentClaimSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentClaimResponse>(PATENT_CLAIM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update patent claim with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a patent claim
 * @param id PatentClaim ID
 * @returns Promise with success response
 */
export const deletePatentClaim = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATENT_CLAIM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete patent claim with ID ${id}`
    };
  }
};
