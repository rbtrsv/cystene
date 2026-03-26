'use client';

import {
  GenomicFileResponse,
  GenomicFilesResponse,
  CreateGenomicFile,
  UpdateGenomicFile,
  CreateGenomicFileSchema,
  UpdateGenomicFileSchema,
} from '../../schemas/user/genomic-file.schemas';
import { GENOMIC_FILE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';


// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing genomic files
 */
export interface ListGenomicFilesParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all genomic files
 * @param params Optional query parameters for pagination
 * @returns Promise with genomic files response
 */
export const getGenomicFiles = async (params?: ListGenomicFilesParams): Promise<GenomicFilesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${GENOMIC_FILE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<GenomicFilesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch genomic files',
      data: []
    };
  }
};

/**
 * Fetch a specific genomic file by ID
 * @param id Genomic file ID
 * @returns Promise with genomic file response
 */
export const getGenomicFile = async (id: number): Promise<GenomicFileResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicFileResponse>(GENOMIC_FILE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch genomic file with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new genomic file
 * @param data Genomic file creation data
 * @returns Promise with genomic file response
 */
export const createGenomicFile = async (data: CreateGenomicFile): Promise<GenomicFileResponse> => {
  // Validate request data
  CreateGenomicFileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicFileResponse>(GENOMIC_FILE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create genomic file',
      data: undefined
    };
  }
};

/**
 * Update an existing genomic file
 * @param id Genomic file ID
 * @param data Genomic file update data
 * @returns Promise with genomic file response
 */
export const updateGenomicFile = async (id: number, data: UpdateGenomicFile): Promise<GenomicFileResponse> => {
  // Validate request data
  UpdateGenomicFileSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<GenomicFileResponse>(GENOMIC_FILE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update genomic file with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a genomic file
 * @param id Genomic file ID
 * @returns Promise with success response
 */
export const deleteGenomicFile = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      GENOMIC_FILE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete genomic file with ID ${id}`
    };
  }
};
