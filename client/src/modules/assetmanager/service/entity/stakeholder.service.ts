'use client';

import {
  StakeholderResponse,
  StakeholdersResponse,
  CreateStakeholder,
  UpdateStakeholder,
  CreateStakeholderSchema,
  UpdateStakeholderSchema,
  StakeholderType,
} from '../../schemas/entity/stakeholder.schemas';
import { STAKEHOLDER_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing stakeholders
 */
export interface ListStakeholdersParams {
  entity_id?: number;
  stakeholder_type?: StakeholderType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all stakeholders user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with stakeholders response
 */
export const getStakeholders = async (params?: ListStakeholdersParams): Promise<StakeholdersResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.stakeholder_type) queryParams.append('stakeholder_type', params.stakeholder_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${STAKEHOLDER_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholdersResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch stakeholders',
      data: []
    };
  }
};

/**
 * Fetch a specific stakeholder by ID
 * @param id Stakeholder ID
 * @returns Promise with stakeholder response
 */
export const getStakeholder = async (id: number): Promise<StakeholderResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderResponse>(STAKEHOLDER_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch stakeholder with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new stakeholder
 * @param data Stakeholder creation data
 * @returns Promise with stakeholder response
 */
export const createStakeholder = async (data: CreateStakeholder): Promise<StakeholderResponse> => {
  // Validate request data
  CreateStakeholderSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderResponse>(STAKEHOLDER_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create stakeholder',
      data: undefined
    };
  }
};

/**
 * Update an existing stakeholder
 * @param id Stakeholder ID
 * @param data Stakeholder update data
 * @returns Promise with stakeholder response
 */
export const updateStakeholder = async (id: number, data: UpdateStakeholder): Promise<StakeholderResponse> => {
  // Validate request data
  UpdateStakeholderSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<StakeholderResponse>(STAKEHOLDER_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update stakeholder with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a stakeholder
 * @param id Stakeholder ID
 * @returns Promise with success response
 */
export const deleteStakeholder = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      STAKEHOLDER_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete stakeholder with ID ${id}`
    };
  }
};
