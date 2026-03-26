'use client';

import {
  DealPipelineResponse,
  DealPipelinesResponse,
  CreateDealPipeline,
  UpdateDealPipeline,
  CreateDealPipelineSchema,
  UpdateDealPipelineSchema,
} from '../../schemas/holding/deal-pipeline.schemas';
import { DEAL_PIPELINE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing deal pipelines
 */
export interface ListDealPipelinesParams {
  entity_id?: number;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all deal pipelines user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with deal pipelines response
 */
export const getDealPipelines = async (params?: ListDealPipelinesParams): Promise<DealPipelinesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id.toString());
    if (params?.status) queryParams.append('status', params.status.toString());
    if (params?.priority) queryParams.append('priority', params.priority.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DEAL_PIPELINE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealPipelinesResponse>(url, { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deal pipeline entries',
      data: [],
    };
  }
};

/**
 * Fetch a specific deal pipeline by ID
 * @param id Deal pipeline ID
 * @returns Promise with deal pipeline response
 */
export const getDealPipeline = async (id: number): Promise<DealPipelineResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealPipelineResponse>(DEAL_PIPELINE_ENDPOINTS.DETAIL(id), { method: 'GET' });
    return response;
  } catch (error) {
    // Clear tokens on 401 errors
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch deal pipeline entry with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Create a new deal pipeline
 * @param data Deal pipeline creation data
 * @returns Promise with deal pipeline response
 */
export const createDealPipeline = async (data: CreateDealPipeline): Promise<DealPipelineResponse> => {
  // Validate request data
  CreateDealPipelineSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealPipelineResponse>(DEAL_PIPELINE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deal pipeline entry',
      data: undefined,
    };
  }
};

/**
 * Update an existing deal pipeline
 * @param id Deal pipeline ID
 * @param data Deal pipeline update data
 * @returns Promise with deal pipeline response
 */
export const updateDealPipeline = async (id: number, data: UpdateDealPipeline): Promise<DealPipelineResponse> => {
  // Validate request data
  UpdateDealPipelineSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DealPipelineResponse>(DEAL_PIPELINE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update deal pipeline entry with ID ${id}`,
      data: undefined,
    };
  }
};

/**
 * Delete a deal pipeline
 * @param id Deal pipeline ID
 * @returns Promise with success response
 */
export const deleteDealPipeline = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DEAL_PIPELINE_ENDPOINTS.DELETE(id),
      { method: 'DELETE' }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete deal pipeline entry with ID ${id}`,
    };
  }
};
