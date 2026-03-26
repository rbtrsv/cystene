'use client';

import {
  PatentAssigneeResponse,
  PatentAssigneesResponse,
  CreatePatentAssignee,
  UpdatePatentAssignee,
  CreatePatentAssigneeSchema,
  UpdatePatentAssigneeSchema,
} from '../../schemas/commercial/patent-assignee.schemas';
import { PATENT_ASSIGNEE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing patent assignees
 */
export interface ListPatentAssigneesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all patent assignees
 * @param params Optional query parameters for pagination
 * @returns Promise with patent assignees response
 */
export const getPatentAssignees = async (params?: ListPatentAssigneesParams): Promise<PatentAssigneesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATENT_ASSIGNEE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PatentAssigneesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch patent assignees',
      data: []
    };
  }
};

/**
 * Fetch a specific patent assignee by ID
 * @param id PatentAssignee ID
 * @returns Promise with patent assignee response
 */
export const getPatentAssignee = async (id: number): Promise<PatentAssigneeResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentAssigneeResponse>(PATENT_ASSIGNEE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch patent assignee with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new patent assignee
 * @param data PatentAssignee creation data
 * @returns Promise with patent assignee response
 */
export const createPatentAssignee = async (data: CreatePatentAssignee): Promise<PatentAssigneeResponse> => {
  // Validate request data
  CreatePatentAssigneeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentAssigneeResponse>(PATENT_ASSIGNEE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create patent assignee',
      data: undefined
    };
  }
};

/**
 * Update an existing patent assignee
 * @param id PatentAssignee ID
 * @param data PatentAssignee update data
 * @returns Promise with patent assignee response
 */
export const updatePatentAssignee = async (id: number, data: UpdatePatentAssignee): Promise<PatentAssigneeResponse> => {
  // Validate request data
  UpdatePatentAssigneeSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PatentAssigneeResponse>(PATENT_ASSIGNEE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update patent assignee with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a patent assignee
 * @param id PatentAssignee ID
 * @returns Promise with success response
 */
export const deletePatentAssignee = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATENT_ASSIGNEE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete patent assignee with ID ${id}`
    };
  }
};
