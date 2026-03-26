'use client';

import {
  FundingRoundResponse,
  FundingRoundsResponse,
  CreateFundingRound,
  UpdateFundingRound,
  CreateFundingRoundSchema,
  UpdateFundingRoundSchema,
  RoundType,
} from '../../schemas/captable/funding-round.schemas';
import { FUNDING_ROUND_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing funding rounds
 */
export interface ListFundingRoundsParams {
  entity_id?: number;
  round_type?: RoundType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all funding rounds user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with funding rounds response
 */
export const getFundingRounds = async (params?: ListFundingRoundsParams): Promise<FundingRoundsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.round_type) queryParams.append('round_type', params.round_type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${FUNDING_ROUND_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FundingRoundsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch funding rounds',
      data: []
    };
  }
};

/**
 * Fetch a specific funding round by ID
 * @param id FundingRound ID
 * @returns Promise with funding round response
 */
export const getFundingRound = async (id: number): Promise<FundingRoundResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FundingRoundResponse>(FUNDING_ROUND_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch funding round with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new funding round
 * @param data FundingRound creation data
 * @returns Promise with funding round response
 */
export const createFundingRound = async (data: CreateFundingRound): Promise<FundingRoundResponse> => {
  // Validate request data
  CreateFundingRoundSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FundingRoundResponse>(FUNDING_ROUND_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create funding round',
      data: undefined
    };
  }
};

/**
 * Update an existing funding round
 * @param id FundingRound ID
 * @param data FundingRound update data
 * @returns Promise with funding round response
 */
export const updateFundingRound = async (id: number, data: UpdateFundingRound): Promise<FundingRoundResponse> => {
  // Validate request data
  UpdateFundingRoundSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FundingRoundResponse>(FUNDING_ROUND_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update funding round with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a funding round
 * @param id FundingRound ID
 * @returns Promise with success response
 */
export const deleteFundingRound = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      FUNDING_ROUND_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete funding round with ID ${id}`
    };
  }
};
