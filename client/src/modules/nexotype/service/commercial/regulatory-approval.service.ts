'use client';

import {
  RegulatoryApprovalResponse,
  RegulatoryApprovalsResponse,
  CreateRegulatoryApproval,
  UpdateRegulatoryApproval,
  CreateRegulatoryApprovalSchema,
  UpdateRegulatoryApprovalSchema,
} from '../../schemas/commercial/regulatory-approval.schemas';
import { REGULATORY_APPROVAL_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing regulatory approvals
 */
export interface ListRegulatoryApprovalsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all regulatory approvals
 * @param params Optional query parameters for pagination
 * @returns Promise with regulatory approvals response
 */
export const getRegulatoryApprovals = async (params?: ListRegulatoryApprovalsParams): Promise<RegulatoryApprovalsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${REGULATORY_APPROVAL_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<RegulatoryApprovalsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch regulatory approvals',
      data: []
    };
  }
};

/**
 * Fetch a specific regulatory approval by ID
 * @param id RegulatoryApproval ID
 * @returns Promise with regulatory approval response
 */
export const getRegulatoryApproval = async (id: number): Promise<RegulatoryApprovalResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RegulatoryApprovalResponse>(REGULATORY_APPROVAL_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch regulatory approval with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new regulatory approval
 * @param data RegulatoryApproval creation data
 * @returns Promise with regulatory approval response
 */
export const createRegulatoryApproval = async (data: CreateRegulatoryApproval): Promise<RegulatoryApprovalResponse> => {
  // Validate request data
  CreateRegulatoryApprovalSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RegulatoryApprovalResponse>(REGULATORY_APPROVAL_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create regulatory approval',
      data: undefined
    };
  }
};

/**
 * Update an existing regulatory approval
 * @param id RegulatoryApproval ID
 * @param data RegulatoryApproval update data
 * @returns Promise with regulatory approval response
 */
export const updateRegulatoryApproval = async (id: number, data: UpdateRegulatoryApproval): Promise<RegulatoryApprovalResponse> => {
  // Validate request data
  UpdateRegulatoryApprovalSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<RegulatoryApprovalResponse>(REGULATORY_APPROVAL_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update regulatory approval with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a regulatory approval
 * @param id RegulatoryApproval ID
 * @returns Promise with success response
 */
export const deleteRegulatoryApproval = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      REGULATORY_APPROVAL_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete regulatory approval with ID ${id}`
    };
  }
};
