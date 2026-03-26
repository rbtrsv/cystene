'use client';

import {
  RecommendationResponse,
  RecommendationsResponse,
  CreateRecommendation,
  UpdateRecommendation,
  CreateRecommendationSchema,
  UpdateRecommendationSchema,
} from '../../schemas/user/recommendation.schemas';
import { RECOMMENDATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing recommendations
 */
export interface ListRecommendationsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all recommendations
 * @param params Optional query parameters for pagination
 * @returns Promise with recommendations response
 */
export const getRecommendations = async (params?: ListRecommendationsParams): Promise<RecommendationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${RECOMMENDATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<RecommendationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
      data: []
    };
  }
};

/**
 * Fetch a specific recommendation by ID
 * @param id Recommendation ID
 * @returns Promise with recommendation response
 */
export const getRecommendation = async (id: number): Promise<RecommendationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RecommendationResponse>(RECOMMENDATION_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch recommendation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new recommendation
 * @param data Recommendation creation data
 * @returns Promise with recommendation response
 */
export const createRecommendation = async (data: CreateRecommendation): Promise<RecommendationResponse> => {
  // Validate request data
  CreateRecommendationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RecommendationResponse>(RECOMMENDATION_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recommendation',
      data: undefined
    };
  }
};

/**
 * Update an existing recommendation
 * @param id Recommendation ID
 * @param data Recommendation update data
 * @returns Promise with recommendation response
 */
export const updateRecommendation = async (id: number, data: UpdateRecommendation): Promise<RecommendationResponse> => {
  // Validate request data
  UpdateRecommendationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RecommendationResponse>(RECOMMENDATION_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update recommendation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a recommendation
 * @param id Recommendation ID
 * @returns Promise with success response
 */
export const deleteRecommendation = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      RECOMMENDATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete recommendation with ID ${id}`
    };
  }
};
