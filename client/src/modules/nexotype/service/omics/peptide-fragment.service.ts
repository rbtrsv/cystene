'use client';

import {
  PeptideFragmentResponse,
  PeptideFragmentsResponse,
  CreatePeptideFragment,
  UpdatePeptideFragment,
  CreatePeptideFragmentSchema,
  UpdatePeptideFragmentSchema,
} from '../../schemas/omics/peptide-fragment.schemas';
import { PEPTIDE_FRAGMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing peptide fragments
 */
export interface ListPeptideFragmentsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all peptide fragments
 * @param params Optional query parameters for pagination
 * @returns Promise with peptide fragments response
 */
export const getPeptideFragments = async (params?: ListPeptideFragmentsParams): Promise<PeptideFragmentsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PEPTIDE_FRAGMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PeptideFragmentsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch peptide fragments',
      data: []
    };
  }
};

/**
 * Fetch a specific peptide fragment by ID
 * @param id Peptide fragment ID
 * @returns Promise with peptide fragment response
 */
export const getPeptideFragment = async (id: number): Promise<PeptideFragmentResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PeptideFragmentResponse>(PEPTIDE_FRAGMENT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch peptide fragment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new peptide fragment
 * @param data Peptide fragment creation data
 * @returns Promise with peptide fragment response
 */
export const createPeptideFragment = async (data: CreatePeptideFragment): Promise<PeptideFragmentResponse> => {
  // Validate request data
  CreatePeptideFragmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PeptideFragmentResponse>(PEPTIDE_FRAGMENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create peptide fragment',
      data: undefined
    };
  }
};

/**
 * Update an existing peptide fragment
 * @param id Peptide fragment ID
 * @param data Peptide fragment update data
 * @returns Promise with peptide fragment response
 */
export const updatePeptideFragment = async (id: number, data: UpdatePeptideFragment): Promise<PeptideFragmentResponse> => {
  // Validate request data
  UpdatePeptideFragmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PeptideFragmentResponse>(PEPTIDE_FRAGMENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update peptide fragment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a peptide fragment
 * @param id Peptide fragment ID
 * @returns Promise with success response
 */
export const deletePeptideFragment = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PEPTIDE_FRAGMENT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete peptide fragment with ID ${id}`
    };
  }
};
