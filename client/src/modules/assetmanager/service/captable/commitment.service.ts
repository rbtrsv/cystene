'use client';

import {
  CommitmentResponse,
  CommitmentsResponse,
  CreateCommitment,
  RespondCommitment,
  ReviewCommitment,
  CreateCommitmentSchema,
  RespondCommitmentSchema,
  ReviewCommitmentSchema,
  CommitmentStatus,
} from '../../schemas/captable/commitment.schemas';
import { COMMITMENT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing commitments
 * Matches backend subrouter query params
 */
export interface ListCommitmentsParams {
  entity_id?: number;
  funding_round_id?: number;
  stakeholder_id?: number;
  source_entity_id?: number;
  status?: CommitmentStatus;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all commitments user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with commitments response
 */
export const getCommitments = async (params?: ListCommitmentsParams): Promise<CommitmentsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.funding_round_id) queryParams.append('funding_round_id', params.funding_round_id.toString());
    if (params?.stakeholder_id) queryParams.append('stakeholder_id', params.stakeholder_id.toString());
    if (params?.source_entity_id) queryParams.append('source_entity_id', params.source_entity_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${COMMITMENT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch commitments',
      data: []
    };
  }
};

/**
 * Fetch a specific commitment by ID
 * @param id Commitment ID
 * @returns Promise with commitment response
 */
export const getCommitment = async (id: number): Promise<CommitmentResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentResponse>(COMMITMENT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch commitment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a single commitment invitation for a stakeholder.
 * raise_amount is sent as a query parameter (calculation input, not persisted).
 * Frontend iterates selected stakeholders and calls this once per stakeholder.
 *
 * @param data Commitment body data (entity_id, funding_round_id, stakeholder_id)
 * @param raise_amount Amount to raise — used for pro-rata calculation on the backend
 * @returns Promise with commitment response
 */
export const createCommitment = async (data: CreateCommitment, raise_amount: number): Promise<CommitmentResponse> => {
  // Validate request data
  CreateCommitmentSchema.parse(data);

  try {
    // raise_amount as query param — not in body, not on model, just a calculation input
    const url = `${COMMITMENT_ENDPOINTS.CREATE}?raise_amount=${raise_amount}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentResponse>(url, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create commitment',
      data: undefined
    };
  }
};

/**
 * Respond to a commitment invitation (stakeholder commits or passes)
 * @param id Commitment ID
 * @param data Response data (status, commitment_type, committed_amount, notes)
 * @returns Promise with commitment response
 */
export const respondToCommitment = async (id: number, data: RespondCommitment): Promise<CommitmentResponse> => {
  // Validate request data
  RespondCommitmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentResponse>(COMMITMENT_ENDPOINTS.RESPOND(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to respond to commitment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Review a committed commitment (admin approves or rejects)
 * @param id Commitment ID
 * @param data Review data (status: approved/rejected)
 * @returns Promise with commitment response
 */
export const reviewCommitment = async (id: number, data: ReviewCommitment): Promise<CommitmentResponse> => {
  // Validate request data
  ReviewCommitmentSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentResponse>(COMMITMENT_ENDPOINTS.REVIEW(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to review commitment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Generate an ISSUANCE SecurityTransaction from an approved commitment.
 * security_id is already on the commitment — only transaction_reference is needed.
 * @param id Commitment ID
 * @param data Transaction data (transaction_reference only)
 * @returns Promise with commitment response
 */
export const generateTransactionFromCommitment = async (
  id: number,
  data: { transaction_reference: string }
): Promise<CommitmentResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<CommitmentResponse>(COMMITMENT_ENDPOINTS.GENERATE_TRANSACTION(id), {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to generate transaction for commitment with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a commitment (soft delete / revoke invitation)
 * @param id Commitment ID
 * @returns Promise with success response
 */
export const deleteCommitment = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      COMMITMENT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete commitment with ID ${id}`
    };
  }
};
