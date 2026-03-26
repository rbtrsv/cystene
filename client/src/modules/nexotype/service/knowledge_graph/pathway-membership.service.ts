'use client';

import {
  PathwayMembershipResponse,
  PathwayMembershipsResponse,
  CreatePathwayMembership,
  UpdatePathwayMembership,
  CreatePathwayMembershipSchema,
  UpdatePathwayMembershipSchema,
} from '../../schemas/knowledge_graph/pathway-membership.schemas';
import { PATHWAY_MEMBERSHIP_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing pathway memberships
 */
export interface ListPathwayMembershipsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all pathway memberships
 * @param params Optional query parameters for pagination
 * @returns Promise with pathway memberships response
 */
export const getPathwayMemberships = async (params?: ListPathwayMembershipsParams): Promise<PathwayMembershipsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${PATHWAY_MEMBERSHIP_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<PathwayMembershipsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch pathway memberships',
      data: []
    };
  }
};

/**
 * Fetch a specific pathway membership by ID
 * @param id PathwayMembership ID
 * @returns Promise with pathway membership response
 */
export const getPathwayMembership = async (id: number): Promise<PathwayMembershipResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayMembershipResponse>(PATHWAY_MEMBERSHIP_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch pathway membership with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new pathway membership
 * @param data PathwayMembership creation data
 * @returns Promise with pathway membership response
 */
export const createPathwayMembership = async (data: CreatePathwayMembership): Promise<PathwayMembershipResponse> => {
  // Validate request data
  CreatePathwayMembershipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayMembershipResponse>(PATHWAY_MEMBERSHIP_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pathway membership',
      data: undefined
    };
  }
};

/**
 * Update an existing pathway membership
 * @param id PathwayMembership ID
 * @param data PathwayMembership update data
 * @returns Promise with pathway membership response
 */
export const updatePathwayMembership = async (id: number, data: UpdatePathwayMembership): Promise<PathwayMembershipResponse> => {
  // Validate request data
  UpdatePathwayMembershipSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<PathwayMembershipResponse>(PATHWAY_MEMBERSHIP_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update pathway membership with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a pathway membership
 * @param id PathwayMembership ID
 * @returns Promise with success response
 */
export const deletePathwayMembership = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      PATHWAY_MEMBERSHIP_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete pathway membership with ID ${id}`
    };
  }
};
