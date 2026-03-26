'use client';

import {
  SubjectResponse,
  SubjectsResponse,
  CreateSubject,
  UpdateSubject,
  CreateSubjectSchema,
  UpdateSubjectSchema,
} from '../../schemas/lims/subject.schemas';
import { SUBJECT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing subjects
 */
export interface ListSubjectsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all subjects
 * @param params Optional query parameters for pagination
 * @returns Promise with subjects response
 */
export const getSubjects = async (params?: ListSubjectsParams): Promise<SubjectsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SUBJECT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<SubjectsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch subjects',
      data: []
    };
  }
};

/**
 * Fetch a specific subject by ID
 * @param id Subject ID
 * @returns Promise with subject response
 */
export const getSubject = async (id: number): Promise<SubjectResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SubjectResponse>(SUBJECT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch subject with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new subject
 * @param data Subject creation data
 * @returns Promise with subject response
 */
export const createSubject = async (data: CreateSubject): Promise<SubjectResponse> => {
  // Validate request data
  CreateSubjectSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SubjectResponse>(SUBJECT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subject',
      data: undefined
    };
  }
};

/**
 * Update an existing subject
 * @param id Subject ID
 * @param data Subject update data
 * @returns Promise with subject response
 */
export const updateSubject = async (id: number, data: UpdateSubject): Promise<SubjectResponse> => {
  // Validate request data
  UpdateSubjectSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SubjectResponse>(SUBJECT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update subject with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a subject
 * @param id Subject ID
 * @returns Promise with success response
 */
export const deleteSubject = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SUBJECT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete subject with ID ${id}`
    };
  }
};
