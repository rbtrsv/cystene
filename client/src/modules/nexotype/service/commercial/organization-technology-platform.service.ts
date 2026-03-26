'use client';

import {
  OrganizationTechnologyPlatformResponse,
  OrganizationTechnologyPlatformsResponse,
  CreateOrganizationTechnologyPlatform,
  UpdateOrganizationTechnologyPlatform,
  CreateOrganizationTechnologyPlatformSchema,
  UpdateOrganizationTechnologyPlatformSchema,
} from '../../schemas/commercial/organization-technology-platform.schemas';
import { ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing organization technology platforms
 */
export interface ListOrganizationTechnologyPlatformsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all organization technology platforms
 * @param params Optional query parameters for pagination
 * @returns Promise with organization technology platforms response
 */
export const getOrganizationTechnologyPlatforms = async (params?: ListOrganizationTechnologyPlatformsParams): Promise<OrganizationTechnologyPlatformsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<OrganizationTechnologyPlatformsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch organization technology platforms',
      data: []
    };
  }
};

/**
 * Fetch a specific organization technology platform by ID
 * @param id OrganizationTechnologyPlatform ID
 * @returns Promise with organization technology platform response
 */
export const getOrganizationTechnologyPlatform = async (id: number): Promise<OrganizationTechnologyPlatformResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganizationTechnologyPlatformResponse>(ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch organization technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new organization technology platform
 * @param data OrganizationTechnologyPlatform creation data
 * @returns Promise with organization technology platform response
 */
export const createOrganizationTechnologyPlatform = async (data: CreateOrganizationTechnologyPlatform): Promise<OrganizationTechnologyPlatformResponse> => {
  // Validate request data
  CreateOrganizationTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganizationTechnologyPlatformResponse>(ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create organization technology platform',
      data: undefined
    };
  }
};

/**
 * Update an existing organization technology platform
 * @param id OrganizationTechnologyPlatform ID
 * @param data OrganizationTechnologyPlatform update data
 * @returns Promise with organization technology platform response
 */
export const updateOrganizationTechnologyPlatform = async (id: number, data: UpdateOrganizationTechnologyPlatform): Promise<OrganizationTechnologyPlatformResponse> => {
  // Validate request data
  UpdateOrganizationTechnologyPlatformSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<OrganizationTechnologyPlatformResponse>(ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update organization technology platform with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a organization technology platform
 * @param id OrganizationTechnologyPlatform ID
 * @returns Promise with success response
 */
export const deleteOrganizationTechnologyPlatform = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ORGANIZATION_TECHNOLOGY_PLATFORM_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete organization technology platform with ID ${id}`
    };
  }
};
