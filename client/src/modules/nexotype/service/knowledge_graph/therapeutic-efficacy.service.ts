'use client';

import {
  TherapeuticEfficacyResponse,
  TherapeuticEfficaciesResponse,
  CreateTherapeuticEfficacy,
  UpdateTherapeuticEfficacy,
  CreateTherapeuticEfficacySchema,
  UpdateTherapeuticEfficacySchema,
} from '../../schemas/knowledge_graph/therapeutic-efficacy.schemas';
import { THERAPEUTIC_EFFICACY_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing therapeutic efficacies
 */
export interface ListTherapeuticEfficaciesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all therapeutic efficacies
 * @param params Optional query parameters for pagination
 * @returns Promise with therapeutic efficacies response
 */
export const getTherapeuticEfficacies = async (params?: ListTherapeuticEfficaciesParams): Promise<TherapeuticEfficaciesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${THERAPEUTIC_EFFICACY_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TherapeuticEfficaciesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch therapeutic efficacies',
      data: []
    };
  }
};

/**
 * Fetch a specific therapeutic efficacy by ID
 * @param id TherapeuticEfficacy ID
 * @returns Promise with therapeutic efficacy response
 */
export const getTherapeuticEfficacy = async (id: number): Promise<TherapeuticEfficacyResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticEfficacyResponse>(THERAPEUTIC_EFFICACY_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch therapeutic efficacy with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new therapeutic efficacy
 * @param data TherapeuticEfficacy creation data
 * @returns Promise with therapeutic efficacy response
 */
export const createTherapeuticEfficacy = async (data: CreateTherapeuticEfficacy): Promise<TherapeuticEfficacyResponse> => {
  // Validate request data
  CreateTherapeuticEfficacySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticEfficacyResponse>(THERAPEUTIC_EFFICACY_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create therapeutic efficacy',
      data: undefined
    };
  }
};

/**
 * Update an existing therapeutic efficacy
 * @param id TherapeuticEfficacy ID
 * @param data TherapeuticEfficacy update data
 * @returns Promise with therapeutic efficacy response
 */
export const updateTherapeuticEfficacy = async (id: number, data: UpdateTherapeuticEfficacy): Promise<TherapeuticEfficacyResponse> => {
  // Validate request data
  UpdateTherapeuticEfficacySchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TherapeuticEfficacyResponse>(THERAPEUTIC_EFFICACY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update therapeutic efficacy with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a therapeutic efficacy
 * @param id TherapeuticEfficacy ID
 * @returns Promise with success response
 */
export const deleteTherapeuticEfficacy = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      THERAPEUTIC_EFFICACY_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete therapeutic efficacy with ID ${id}`
    };
  }
};
