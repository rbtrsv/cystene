'use client';

import {
  SyndicateMemberResponse,
  SyndicateMembersResponse,
  CreateSyndicateMember,
  UpdateSyndicateMember,
  CreateSyndicateMemberSchema,
  UpdateSyndicateMemberSchema,
} from '../../schemas/entity/syndicate-member.schemas';
import { SYNDICATE_MEMBER_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing syndicate members
 */
export interface ListSyndicateMembersParams {
  syndicate_id?: number;
  member_entity_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all syndicate members
 * @param params Optional query parameters for filtering
 * @returns Promise with syndicate members response
 */
export const getSyndicateMembers = async (
  params?: ListSyndicateMembersParams
): Promise<SyndicateMembersResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.syndicate_id) queryParams.append('syndicate_id', params.syndicate_id.toString());
    if (params?.member_entity_id) queryParams.append('member_entity_id', params.member_entity_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SYNDICATE_MEMBER_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateMembersResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch syndicate members',
      data: []
    };
  }
};

/**
 * Fetch a specific syndicate member by ID
 * @param id Syndicate member ID
 * @returns Promise with syndicate member response
 */
export const getSyndicateMember = async (id: number): Promise<SyndicateMemberResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateMemberResponse>(
      SYNDICATE_MEMBER_ENDPOINTS.DETAIL(id),
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
      error: error instanceof Error ? error.message : `Failed to fetch syndicate member with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new syndicate member
 * @param data Syndicate member creation data
 * @returns Promise with syndicate member response
 */
export const createSyndicateMember = async (
  data: CreateSyndicateMember
): Promise<SyndicateMemberResponse> => {
  // Validate request data
  CreateSyndicateMemberSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateMemberResponse>(
      SYNDICATE_MEMBER_ENDPOINTS.CREATE,
      {
        method: 'POST',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create syndicate member',
      data: undefined
    };
  }
};

/**
 * Update an existing syndicate member
 * @param id Syndicate member ID
 * @param data Syndicate member update data
 * @returns Promise with syndicate member response
 */
export const updateSyndicateMember = async (
  id: number,
  data: UpdateSyndicateMember
): Promise<SyndicateMemberResponse> => {
  // Validate request data
  UpdateSyndicateMemberSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<SyndicateMemberResponse>(
      SYNDICATE_MEMBER_ENDPOINTS.UPDATE(id),
      {
        method: 'PUT',
        body: data as unknown as Record<string, unknown>
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update syndicate member with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a syndicate member
 * @param id Syndicate member ID
 * @returns Promise with success response
 */
export const deleteSyndicateMember = async (
  id: number
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SYNDICATE_MEMBER_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete syndicate member with ID ${id}`
    };
  }
};
