'use client';

import {
  EntityOrganizationInvitationResponse,
  EntityOrganizationInvitationsResponse,
  CreateEntityOrganizationInvitation,
  UpdateEntityOrganizationInvitation,
  CreateEntityOrganizationInvitationSchema,
  UpdateEntityOrganizationInvitationSchema,
  InvitationStatus,
} from '../../schemas/entity/entity-organization-invitations.schema';
import { ENTITY_ORGANIZATION_INVITATION_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing entity organization invitations
 */
export interface ListEntityOrganizationInvitationsParams {
  entity_id?: number;
  organization_id?: number;
  status?: InvitationStatus;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all entity organization invitations
 * @param params Optional query parameters for filtering
 * @returns Promise with entity organization invitations response
 */
export const getEntityOrganizationInvitations = async (
  params?: ListEntityOrganizationInvitationsParams
): Promise<EntityOrganizationInvitationsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch entity organization invitations',
      data: []
    };
  }
};

/**
 * Fetch a specific entity organization invitation by ID
 * @param id Entity organization invitation ID
 * @returns Promise with entity organization invitation response
 */
export const getEntityOrganizationInvitation = async (id: number): Promise<EntityOrganizationInvitationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationResponse>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.DETAIL(id),
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
      error: error instanceof Error ? error.message : `Failed to fetch entity organization invitation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new entity organization invitation
 * @param data Entity organization invitation creation data
 * @returns Promise with entity organization invitation response
 */
export const createEntityOrganizationInvitation = async (
  data: CreateEntityOrganizationInvitation
): Promise<EntityOrganizationInvitationResponse> => {
  // Validate request data
  CreateEntityOrganizationInvitationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationResponse>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create entity organization invitation',
      data: undefined
    };
  }
};

/**
 * Update an existing entity organization invitation
 * @param id Entity organization invitation ID
 * @param data Entity organization invitation update data
 * @returns Promise with entity organization invitation response
 */
export const updateEntityOrganizationInvitation = async (
  id: number,
  data: UpdateEntityOrganizationInvitation
): Promise<EntityOrganizationInvitationResponse> => {
  // Validate request data
  UpdateEntityOrganizationInvitationSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationResponse>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update entity organization invitation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Accept an entity organization invitation
 * @param id Entity organization invitation ID
 * @returns Promise with entity organization invitation response
 */
export const acceptEntityOrganizationInvitation = async (
  id: number
): Promise<EntityOrganizationInvitationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationResponse>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.ACCEPT(id),
      {
        method: 'POST'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to accept entity organization invitation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Reject an entity organization invitation
 * @param id Entity organization invitation ID
 * @returns Promise with entity organization invitation response
 */
export const rejectEntityOrganizationInvitation = async (
  id: number
): Promise<EntityOrganizationInvitationResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<EntityOrganizationInvitationResponse>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.REJECT(id),
      {
        method: 'POST'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to reject entity organization invitation with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete an entity organization invitation
 * @param id Entity organization invitation ID
 * @returns Promise with success response
 */
export const deleteEntityOrganizationInvitation = async (
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      ENTITY_ORGANIZATION_INVITATION_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete entity organization invitation with ID ${id}`
    };
  }
};
