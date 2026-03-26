'use client';

import {
  DealCommitmentResponse,
  DealCommitmentsResponse,
  CreateDealCommitment,
  UpdateDealCommitment,
  CreateDealCommitmentSchema,
  UpdateDealCommitmentSchema,
  CommitmentType,
} from '../../schemas/deal/deal-commitment.schemas';
import { DEAL_COMMITMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing deal commitments
 */
export interface ListDealCommitmentsParams {
  deal_id?: number;
  entity_id?: number;
  commitment_type?: CommitmentType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all deal commitments user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with deal commitments response
 */
export const getDealCommitments = async (params?: ListDealCommitmentsParams): Promise<DealCommitmentsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.deal_id) queryParams.append('deal_id', params.deal_id.toString());
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.commitment_type) queryParams.append('commitment_type', params.commitment_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DEAL_COMMITMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealCommitmentsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deal commitments',
      data: [],
    };
  }
};

/**
 * Fetch a specific deal commitment by ID
 * @param id DealCommitment ID
 * @returns Promise with deal commitment response
 */
export const getDealCommitment = async (id: number): Promise<DealCommitmentResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealCommitmentResponse>(DEAL_COMMITMENT_ENDPOINTS.DETAIL(id), {
      method: 'GET',
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
      error: error instanceof Error ? error.message : `Failed to fetch deal commitment with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new deal commitment
 * @param data DealCommitment creation data
 * @returns Promise with deal commitment response
 */
export const createDealCommitment = async (data: CreateDealCommitment): Promise<DealCommitmentResponse> => {
  // Validate request data
  CreateDealCommitmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealCommitmentResponse>(DEAL_COMMITMENT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deal commitment',
      data: undefined,
    };
  }
};

/**
 * Update an existing deal commitment
 * @param id DealCommitment ID
 * @param data DealCommitment update data
 * @returns Promise with deal commitment response
 */
export const updateDealCommitment = async (id: number, data: UpdateDealCommitment): Promise<DealCommitmentResponse> => {
  // Validate request data
  UpdateDealCommitmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealCommitmentResponse>(DEAL_COMMITMENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update deal commitment with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a deal commitment
 * @param id DealCommitment ID
 * @returns Promise with success response
 */
export const deleteDealCommitment = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DEAL_COMMITMENT_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete deal commitment with ID ${id}`,
    };
  }
};
