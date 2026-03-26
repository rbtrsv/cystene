'use client';

import {
  TranscriptResponse,
  TranscriptsResponse,
  CreateTranscript,
  UpdateTranscript,
  CreateTranscriptSchema,
  UpdateTranscriptSchema,
} from '../../schemas/omics/transcript.schemas';
import { TRANSCRIPT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing transcripts
 */
export interface ListTranscriptsParams {
  limit?: number;
  offset?: number;
}

/**
 * Fetch all transcripts
 * @param params Optional query parameters for pagination
 * @returns Promise with transcripts response
 */
export const getTranscripts = async (params?: ListTranscriptsParams): Promise<TranscriptsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${TRANSCRIPT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<TranscriptsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch transcripts',
      data: []
    };
  }
};

/**
 * Fetch a specific transcript by ID
 * @param id Transcript ID
 * @returns Promise with transcript response
 */
export const getTranscript = async (id: number): Promise<TranscriptResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TranscriptResponse>(TRANSCRIPT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch transcript with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new transcript
 * @param data Transcript creation data
 * @returns Promise with transcript response
 */
export const createTranscript = async (data: CreateTranscript): Promise<TranscriptResponse> => {
  // Validate request data
  CreateTranscriptSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TranscriptResponse>(TRANSCRIPT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create transcript',
      data: undefined
    };
  }
};

/**
 * Update an existing transcript
 * @param id Transcript ID
 * @param data Transcript update data
 * @returns Promise with transcript response
 */
export const updateTranscript = async (id: number, data: UpdateTranscript): Promise<TranscriptResponse> => {
  // Validate request data
  UpdateTranscriptSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<TranscriptResponse>(TRANSCRIPT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update transcript with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a transcript
 * @param id Transcript ID
 * @returns Promise with success response
 */
export const deleteTranscript = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      TRANSCRIPT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete transcript with ID ${id}`
    };
  }
};
