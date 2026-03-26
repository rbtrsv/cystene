'use client';

import {
  UserProfileResponse,
  UserProfilesResponse,
  CreateUserProfile,
  UpdateUserProfile,
  CreateUserProfileSchema,
  UpdateUserProfileSchema,
} from '../../schemas/user/user-profile.schemas';
import { USER_PROFILE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing user profiles
 */
export interface ListUserProfilesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all user profiles
 * @param params Optional query parameters for pagination
 * @returns Promise with user profiles response
 */
export const getUserProfiles = async (params?: ListUserProfilesParams): Promise<UserProfilesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${USER_PROFILE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<UserProfilesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch user profiles',
      data: []
    };
  }
};

/**
 * Fetch a specific user profile by ID
 * @param id User profile ID
 * @returns Promise with user profile response
 */
export const getUserProfile = async (id: number): Promise<UserProfileResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserProfileResponse>(USER_PROFILE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch user profile with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new user profile
 * @param data User profile creation data
 * @returns Promise with user profile response
 */
export const createUserProfile = async (data: CreateUserProfile): Promise<UserProfileResponse> => {
  // Validate request data
  CreateUserProfileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserProfileResponse>(USER_PROFILE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user profile',
      data: undefined
    };
  }
};

/**
 * Update an existing user profile
 * @param id User profile ID
 * @param data User profile update data
 * @returns Promise with user profile response
 */
export const updateUserProfile = async (id: number, data: UpdateUserProfile): Promise<UserProfileResponse> => {
  // Validate request data
  UpdateUserProfileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<UserProfileResponse>(USER_PROFILE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update user profile with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a user profile
 * @param id User profile ID
 * @returns Promise with success response
 */
export const deleteUserProfile = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      USER_PROFILE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete user profile with ID ${id}`
    };
  }
};
