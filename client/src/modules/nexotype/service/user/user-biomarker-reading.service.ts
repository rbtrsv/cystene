'use client';

import {
  UserBiomarkerReadingResponse,
  UserBiomarkerReadingsResponse,
  CreateUserBiomarkerReading,
  UpdateUserBiomarkerReading,
  CreateUserBiomarkerReadingSchema,
  UpdateUserBiomarkerReadingSchema,
} from '../../schemas/user/user-biomarker-reading.schemas';
import { USER_BIOMARKER_READING_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing user biomarker readings
 */
export interface ListUserBiomarkerReadingsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all user biomarker readings
 * @param params Optional query parameters for pagination
 * @returns Promise with user biomarker readings response
 */
export const getUserBiomarkerReadings = async (params?: ListUserBiomarkerReadingsParams): Promise<UserBiomarkerReadingsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${USER_BIOMARKER_READING_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<UserBiomarkerReadingsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch user biomarker readings',
      data: []
    };
  }
};

/**
 * Fetch a specific user biomarker reading by ID
 * @param id User biomarker reading ID
 * @returns Promise with user biomarker reading response
 */
export const getUserBiomarkerReading = async (id: number): Promise<UserBiomarkerReadingResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserBiomarkerReadingResponse>(USER_BIOMARKER_READING_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch user biomarker reading with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new user biomarker reading
 * @param data User biomarker reading creation data
 * @returns Promise with user biomarker reading response
 */
export const createUserBiomarkerReading = async (data: CreateUserBiomarkerReading): Promise<UserBiomarkerReadingResponse> => {
  // Validate request data
  CreateUserBiomarkerReadingSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserBiomarkerReadingResponse>(USER_BIOMARKER_READING_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user biomarker reading',
      data: undefined
    };
  }
};

/**
 * Update an existing user biomarker reading
 * @param id User biomarker reading ID
 * @param data User biomarker reading update data
 * @returns Promise with user biomarker reading response
 */
export const updateUserBiomarkerReading = async (id: number, data: UpdateUserBiomarkerReading): Promise<UserBiomarkerReadingResponse> => {
  // Validate request data
  UpdateUserBiomarkerReadingSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserBiomarkerReadingResponse>(USER_BIOMARKER_READING_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update user biomarker reading with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a user biomarker reading
 * @param id User biomarker reading ID
 * @returns Promise with success response
 */
export const deleteUserBiomarkerReading = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      USER_BIOMARKER_READING_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete user biomarker reading with ID ${id}`
    };
  }
};
