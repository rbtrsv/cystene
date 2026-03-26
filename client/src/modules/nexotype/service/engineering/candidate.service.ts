'use client';

import {
  CandidateResponse,
  CandidatesResponse,
  CreateCandidate,
  UpdateCandidate,
  CreateCandidateSchema,
  UpdateCandidateSchema,
} from '../../schemas/engineering/candidate.schemas';
import { CANDIDATE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing candidates
 */
export interface ListCandidatesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all candidates
 * @param params Optional query parameters for pagination
 * @returns Promise with candidates response
 */
export const getCandidates = async (params?: ListCandidatesParams): Promise<CandidatesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${CANDIDATE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<CandidatesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch candidates',
      data: []
    };
  }
};

/**
 * Fetch a specific candidate by ID
 * @param id Candidate ID
 * @returns Promise with candidate response
 */
export const getCandidate = async (id: number): Promise<CandidateResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CandidateResponse>(CANDIDATE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch candidate with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new candidate
 * @param data Candidate creation data
 * @returns Promise with candidate response
 */
export const createCandidate = async (data: CreateCandidate): Promise<CandidateResponse> => {
  // Validate request data
  CreateCandidateSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CandidateResponse>(CANDIDATE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create candidate',
      data: undefined
    };
  }
};

/**
 * Update an existing candidate
 * @param id Candidate ID
 * @param data Candidate update data
 * @returns Promise with candidate response
 */
export const updateCandidate = async (id: number, data: UpdateCandidate): Promise<CandidateResponse> => {
  // Validate request data
  UpdateCandidateSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CandidateResponse>(CANDIDATE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update candidate with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a candidate
 * @param id Candidate ID
 * @returns Promise with success response
 */
export const deleteCandidate = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      CANDIDATE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete candidate with ID ${id}`
    };
  }
};
