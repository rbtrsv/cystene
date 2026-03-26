'use client';

import {
  EvidenceAssertionResponse,
  EvidenceAssertionsResponse,
  CreateEvidenceAssertion,
  UpdateEvidenceAssertion,
  CreateEvidenceAssertionSchema,
  UpdateEvidenceAssertionSchema,
} from '../../schemas/knowledge_graph/evidence-assertion.schemas';
import { EVIDENCE_ASSERTION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing evidence assertions
 */
export interface ListEvidenceAssertionsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all evidence assertions
 * @param params Optional query parameters for pagination
 * @returns Promise with evidence assertions response
 */
export const getEvidenceAssertions = async (params?: ListEvidenceAssertionsParams): Promise<EvidenceAssertionsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${EVIDENCE_ASSERTION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<EvidenceAssertionsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch evidence assertions',
      data: []
    };
  }
};

/**
 * Fetch a specific evidence assertion by ID
 * @param id EvidenceAssertion ID
 * @returns Promise with evidence assertion response
 */
export const getEvidenceAssertion = async (id: number): Promise<EvidenceAssertionResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EvidenceAssertionResponse>(EVIDENCE_ASSERTION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch evidence assertion with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new evidence assertion
 * @param data EvidenceAssertion creation data
 * @returns Promise with evidence assertion response
 */
export const createEvidenceAssertion = async (data: CreateEvidenceAssertion): Promise<EvidenceAssertionResponse> => {
  // Validate request data
  CreateEvidenceAssertionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EvidenceAssertionResponse>(EVIDENCE_ASSERTION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create evidence assertion',
      data: undefined
    };
  }
};

/**
 * Update an existing evidence assertion
 * @param id EvidenceAssertion ID
 * @param data EvidenceAssertion update data
 * @returns Promise with evidence assertion response
 */
export const updateEvidenceAssertion = async (id: number, data: UpdateEvidenceAssertion): Promise<EvidenceAssertionResponse> => {
  // Validate request data
  UpdateEvidenceAssertionSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EvidenceAssertionResponse>(EVIDENCE_ASSERTION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update evidence assertion with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an evidence assertion
 * @param id EvidenceAssertion ID
 * @returns Promise with success response
 */
export const deleteEvidenceAssertion = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      EVIDENCE_ASSERTION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete evidence assertion with ID ${id}`
    };
  }
};
