'use client';

import {
  DevelopmentPipelineResponse,
  DevelopmentPipelinesResponse,
  CreateDevelopmentPipeline,
  UpdateDevelopmentPipeline,
  CreateDevelopmentPipelineSchema,
  UpdateDevelopmentPipelineSchema,
} from '../../schemas/commercial/development-pipeline.schemas';
import { DEVELOPMENT_PIPELINE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing development pipelines
 */
export interface ListDevelopmentPipelinesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all development pipelines
 * @param params Optional query parameters for pagination
 * @returns Promise with development pipelines response
 */
export const getDevelopmentPipelines = async (params?: ListDevelopmentPipelinesParams): Promise<DevelopmentPipelinesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${DEVELOPMENT_PIPELINE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<DevelopmentPipelinesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch development pipelines',
      data: []
    };
  }
};

/**
 * Fetch a specific development pipeline by ID
 * @param id DevelopmentPipeline ID
 * @returns Promise with development pipeline response
 */
export const getDevelopmentPipeline = async (id: number): Promise<DevelopmentPipelineResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DevelopmentPipelineResponse>(DEVELOPMENT_PIPELINE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch development pipeline with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new development pipeline
 * @param data DevelopmentPipeline creation data
 * @returns Promise with development pipeline response
 */
export const createDevelopmentPipeline = async (data: CreateDevelopmentPipeline): Promise<DevelopmentPipelineResponse> => {
  // Validate request data
  CreateDevelopmentPipelineSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DevelopmentPipelineResponse>(DEVELOPMENT_PIPELINE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create development pipeline',
      data: undefined
    };
  }
};

/**
 * Update an existing development pipeline
 * @param id DevelopmentPipeline ID
 * @param data DevelopmentPipeline update data
 * @returns Promise with development pipeline response
 */
export const updateDevelopmentPipeline = async (id: number, data: UpdateDevelopmentPipeline): Promise<DevelopmentPipelineResponse> => {
  // Validate request data
  UpdateDevelopmentPipelineSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<DevelopmentPipelineResponse>(DEVELOPMENT_PIPELINE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update development pipeline with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a development pipeline
 * @param id DevelopmentPipeline ID
 * @returns Promise with success response
 */
export const deleteDevelopmentPipeline = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      DEVELOPMENT_PIPELINE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete development pipeline with ID ${id}`
    };
  }
};
