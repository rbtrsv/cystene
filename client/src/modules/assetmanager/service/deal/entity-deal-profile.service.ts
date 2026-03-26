'use client';

import {
  EntityDealProfileResponse,
  EntityDealProfilesResponse,
  CreateEntityDealProfile,
  UpdateEntityDealProfile,
  CreateEntityDealProfileSchema,
  UpdateEntityDealProfileSchema,
} from '../../schemas/deal/entity-deal-profile.schemas';
import { ENTITY_DEAL_PROFILE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing entity deal profiles
 */
export interface ListEntityDealProfilesParams {
  entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all entity deal profiles user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with entity deal profiles response
 */
export const getEntityDealProfiles = async (params?: ListEntityDealProfilesParams): Promise<EntityDealProfilesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ENTITY_DEAL_PROFILE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityDealProfilesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch entity deal profiles',
      data: []
    };
  }
};

/**
 * Fetch a specific entity deal profile by ID
 * @param id EntityDealProfile ID
 * @returns Promise with entity deal profile response
 */
export const getEntityDealProfile = async (id: number): Promise<EntityDealProfileResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityDealProfileResponse>(ENTITY_DEAL_PROFILE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch entity deal profile with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new entity deal profile
 * @param data EntityDealProfile creation data
 * @returns Promise with entity deal profile response
 */
export const createEntityDealProfile = async (data: CreateEntityDealProfile): Promise<EntityDealProfileResponse> => {
  // Validate request data
  CreateEntityDealProfileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityDealProfileResponse>(ENTITY_DEAL_PROFILE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create entity deal profile',
      data: undefined
    };
  }
};

/**
 * Update an existing entity deal profile
 * @param id EntityDealProfile ID
 * @param data EntityDealProfile update data
 * @returns Promise with entity deal profile response
 */
export const updateEntityDealProfile = async (id: number, data: UpdateEntityDealProfile): Promise<EntityDealProfileResponse> => {
  // Validate request data
  UpdateEntityDealProfileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityDealProfileResponse>(ENTITY_DEAL_PROFILE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update entity deal profile with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an entity deal profile
 * @param id EntityDealProfile ID
 * @returns Promise with success response
 */
export const deleteEntityDealProfile = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ENTITY_DEAL_PROFILE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete entity deal profile with ID ${id}`
    };
  }
};
