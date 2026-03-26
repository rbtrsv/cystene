'use client';

import {
  PathwayScoreResponse,
  PathwayScoresResponse,
  CreatePathwayScore,
  UpdatePathwayScore,
  CreatePathwayScoreSchema,
  UpdatePathwayScoreSchema,
} from '../../schemas/user/pathway-score.schemas';
import { PATHWAY_SCORE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing pathway scores
 */
export interface ListPathwayScoresParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all pathway scores
 * @param params Optional query parameters for pagination
 * @returns Promise with pathway scores response
 */
export const getPathwayScores = async (params?: ListPathwayScoresParams): Promise<PathwayScoresResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATHWAY_SCORE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PathwayScoresResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch pathway scores',
      data: []
    };
  }
};

/**
 * Fetch a specific pathway score by ID
 * @param id Pathway score ID
 * @returns Promise with pathway score response
 */
export const getPathwayScore = async (id: number): Promise<PathwayScoreResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayScoreResponse>(PATHWAY_SCORE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch pathway score with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new pathway score
 * @param data Pathway score creation data
 * @returns Promise with pathway score response
 */
export const createPathwayScore = async (data: CreatePathwayScore): Promise<PathwayScoreResponse> => {
  // Validate request data
  CreatePathwayScoreSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayScoreResponse>(PATHWAY_SCORE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pathway score',
      data: undefined
    };
  }
};

/**
 * Update an existing pathway score
 * @param id Pathway score ID
 * @param data Pathway score update data
 * @returns Promise with pathway score response
 */
export const updatePathwayScore = async (id: number, data: UpdatePathwayScore): Promise<PathwayScoreResponse> => {
  // Validate request data
  UpdatePathwayScoreSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayScoreResponse>(PATHWAY_SCORE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update pathway score with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a pathway score
 * @param id Pathway score ID
 * @returns Promise with success response
 */
export const deletePathwayScore = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATHWAY_SCORE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete pathway score with ID ${id}`
    };
  }
};
