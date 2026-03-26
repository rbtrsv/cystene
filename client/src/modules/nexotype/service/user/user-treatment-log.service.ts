'use client';

import {
  UserTreatmentLogResponse,
  UserTreatmentLogsResponse,
  CreateUserTreatmentLog,
  UpdateUserTreatmentLog,
  CreateUserTreatmentLogSchema,
  UpdateUserTreatmentLogSchema,
} from '../../schemas/user/user-treatment-log.schemas';
import { USER_TREATMENT_LOG_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing user treatment logs
 */
export interface ListUserTreatmentLogsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all user treatment logs
 * @param params Optional query parameters for pagination
 * @returns Promise with user treatment logs response
 */
export const getUserTreatmentLogs = async (params?: ListUserTreatmentLogsParams): Promise<UserTreatmentLogsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${USER_TREATMENT_LOG_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<UserTreatmentLogsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch user treatment logs',
      data: []
    };
  }
};

/**
 * Fetch a specific user treatment log by ID
 * @param id User treatment log ID
 * @returns Promise with user treatment log response
 */
export const getUserTreatmentLog = async (id: number): Promise<UserTreatmentLogResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserTreatmentLogResponse>(USER_TREATMENT_LOG_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch user treatment log with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new user treatment log
 * @param data User treatment log creation data
 * @returns Promise with user treatment log response
 */
export const createUserTreatmentLog = async (data: CreateUserTreatmentLog): Promise<UserTreatmentLogResponse> => {
  // Validate request data
  CreateUserTreatmentLogSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserTreatmentLogResponse>(USER_TREATMENT_LOG_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user treatment log',
      data: undefined
    };
  }
};

/**
 * Update an existing user treatment log
 * @param id User treatment log ID
 * @param data User treatment log update data
 * @returns Promise with user treatment log response
 */
export const updateUserTreatmentLog = async (id: number, data: UpdateUserTreatmentLog): Promise<UserTreatmentLogResponse> => {
  // Validate request data
  UpdateUserTreatmentLogSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserTreatmentLogResponse>(USER_TREATMENT_LOG_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update user treatment log with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a user treatment log
 * @param id User treatment log ID
 * @returns Promise with success response
 */
export const deleteUserTreatmentLog = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      USER_TREATMENT_LOG_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete user treatment log with ID ${id}`
    };
  }
};
