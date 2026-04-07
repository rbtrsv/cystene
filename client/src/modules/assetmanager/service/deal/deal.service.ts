'use client';

import {
  DealResponse,
  DealsResponse,
  DealExecuteResponse,
  CreateDeal,
  UpdateDeal,
  DealStatus,
  DealExecuteInput,
  CreateDealSchema,
  UpdateDealSchema,
  DealStatusUpdateSchema,
  DealExecuteInputSchema,
  DealType,
} from '../../schemas/deal/deal.schemas';
import { DEAL_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing Deals
 */
export interface ListDealsParams {
  entity_id?: number;
  deal_type?: DealType;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all deals user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with deals response
 */
export const getDeals = async (params?: ListDealsParams): Promise<DealsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.deal_type) queryParams.append('deal_type', params.deal_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DEAL_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealsResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deals',
      data: [],
    };
  }
};

/**
 * Fetch a specific deal by ID
 * @param id Deal ID
 * @returns Promise with deal response
 */
export const getDeal = async (id: number): Promise<DealResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealResponse>(DEAL_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch deal with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new deal
 * @param data Deal creation data
 * @returns Promise with deal response
 */
export const createDeal = async (data: CreateDeal): Promise<DealResponse> => {
  // Validate request data
  CreateDealSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealResponse>(DEAL_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deal',
      data: undefined,
    };
  }
};

/**
 * Update an existing deal
 * @param id Deal ID
 * @param data Deal update data
 * @returns Promise with deal response
 */
export const updateDeal = async (id: number, data: UpdateDeal): Promise<DealResponse> => {
  // Validate request data
  UpdateDealSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealResponse>(DEAL_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update deal with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a deal
 * @param id Deal ID
 * @returns Promise with success response
 */
export const deleteDeal = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DEAL_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete deal with ID ${id}`,
    };
  }
};

/**
 * Update deal status via dedicated status transition endpoint
 * @param id Deal ID
 * @param status New deal status
 * @returns Promise with deal response
 */
export const updateDealStatus = async (id: number, status: DealStatus): Promise<DealResponse> => {
  DealStatusUpdateSchema.parse({ status });

  try {
    const response = await fetchClient<DealResponse>(DEAL_ENDPOINTS.STATUS(id), {
      method: 'PUT',
      body: { status } as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update deal status for ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Execute a fundraising deal — creates cap table impact
 * @param id Deal ID
 * @param data Execution input (round_type, security details, stakeholder_type)
 * @returns Promise with execution response
 */
export const executeDeal = async (id: number, data: DealExecuteInput): Promise<DealExecuteResponse> => {
  DealExecuteInputSchema.parse(data);

  try {
    const response = await fetchClient<DealExecuteResponse>(DEAL_ENDPOINTS.EXECUTE(id), {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      funding_round_id: 0,
      security_id: 0,
      stakeholders_created: 0,
      transactions_created: 0,
      total_amount: 0,
      message: '',
      error: error instanceof Error ? error.message : `Failed to execute deal with ID ${id}`,
    };
  }
};
