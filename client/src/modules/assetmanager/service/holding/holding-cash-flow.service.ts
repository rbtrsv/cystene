'use client';

import {
  HoldingCashFlowResponse,
  HoldingCashFlowsResponse,
  CreateHoldingCashFlow,
  UpdateHoldingCashFlow,
  CreateHoldingCashFlowSchema,
  UpdateHoldingCashFlowSchema,
} from '../../schemas/holding/holding-cash-flow.schemas';
import { HOLDING_CASH_FLOW_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing holding cash flows
 */
export interface ListHoldingCashFlowsParams {
  holding_id?: number;
  entity_id?: number;
  cash_flow_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all holding cash flows user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with holding cash flows response
 */
export const getHoldingCashFlows = async (params?: ListHoldingCashFlowsParams): Promise<HoldingCashFlowsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.holding_id) queryParams.append('holding_id', params.holding_id.toString());
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.cash_flow_type) queryParams.append('cash_flow_type', params.cash_flow_type.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${HOLDING_CASH_FLOW_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingCashFlowsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch holding cash flows',
      data: [],
    };
  }
};

/**
 * Fetch a specific holding cash flow by ID
 * @param id Holding cash flow ID
 * @returns Promise with holding cash flow response
 */
export const getHoldingCashFlow = async (id: number): Promise<HoldingCashFlowResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingCashFlowResponse>(HOLDING_CASH_FLOW_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch holding cash flow with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new holding cash flow
 * @param data Holding cash flow creation data
 * @returns Promise with holding cash flow response
 */
export const createHoldingCashFlow = async (data: CreateHoldingCashFlow): Promise<HoldingCashFlowResponse> => {
  // Validate request data
  CreateHoldingCashFlowSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingCashFlowResponse>(HOLDING_CASH_FLOW_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create holding cash flow',
      data: undefined,
    };
  }
};

/**
 * Update an existing holding cash flow
 * @param id Holding cash flow ID
 * @param data Holding cash flow update data
 * @returns Promise with holding cash flow response
 */
export const updateHoldingCashFlow = async (id: number, data: UpdateHoldingCashFlow): Promise<HoldingCashFlowResponse> => {
  // Validate request data
  UpdateHoldingCashFlowSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<HoldingCashFlowResponse>(HOLDING_CASH_FLOW_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update holding cash flow with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a holding cash flow
 * @param id Holding cash flow ID
 * @returns Promise with success response
 */
export const deleteHoldingCashFlow = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      HOLDING_CASH_FLOW_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete holding cash flow with ID ${id}`,
    };
  }
};
