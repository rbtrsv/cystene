'use client';

import {
  EntityOrganizationMemberResponse,
  EntityOrganizationMembersResponse,
  CreateEntityOrganizationMember,
  UpdateEntityOrganizationMember,
  CreateEntityOrganizationMemberSchema,
  UpdateEntityOrganizationMemberSchema,
} from '../../schemas/entity/entity-organization-members.schema';
import { ENTITY_ORGANIZATION_MEMBER_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing entity organization members
 */
export interface ListEntityOrganizationMembersParams {
  entity_id?: number;
  organization_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all entity organization members
 * @param params Optional query parameters for filtering
 * @returns Promise with entity organization members response
 */
export const getEntityOrganizationMembers = async (
  params?: ListEntityOrganizationMembersParams
): Promise<EntityOrganizationMembersResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ENTITY_ORGANIZATION_MEMBER_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationMembersResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch entity organization members',
      data: []
    };
  }
};

/**
 * Fetch a specific entity organization member by ID
 * @param id Entity organization member ID
 * @returns Promise with entity organization member response
 */
export const getEntityOrganizationMember = async (id: number): Promise<EntityOrganizationMemberResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationMemberResponse>(
      ENTITY_ORGANIZATION_MEMBER_ENDPOINTS.DETAIL(id),
      {
        method: 'GET'
      }
    );

    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch entity organization member with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new entity organization member
 * @param data Entity organization member creation data
 * @returns Promise with entity organization member response
 */
export const createEntityOrganizationMember = async (
  data: CreateEntityOrganizationMember
): Promise<EntityOrganizationMemberResponse> => {
  // Validate request data
  CreateEntityOrganizationMemberSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationMemberResponse>(
      ENTITY_ORGANIZATION_MEMBER_ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create entity organization member',
      data: undefined
    };
  }
};

/**
 * Update an existing entity organization member
 * @param id Entity organization member ID
 * @param data Entity organization member update data
 * @returns Promise with entity organization member response
 */
export const updateEntityOrganizationMember = async (
  id: number,
  data: UpdateEntityOrganizationMember
): Promise<EntityOrganizationMemberResponse> => {
  // Validate request data
  UpdateEntityOrganizationMemberSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationMemberResponse>(
      ENTITY_ORGANIZATION_MEMBER_ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update entity organization member with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an entity organization member
 * @param id Entity organization member ID
 * @returns Promise with success response
 */
export const deleteEntityOrganizationMember = async (
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ENTITY_ORGANIZATION_MEMBER_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete entity organization member with ID ${id}`
    };
  }
};
