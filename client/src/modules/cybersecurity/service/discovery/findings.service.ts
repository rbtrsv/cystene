'use client';

/**
 * Finding Service
 *
 * List, detail, and triage status update for Finding model.
 * No create/delete — scanner writes findings. User only updates triage status via PATCH.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/finding_subrouter.py
 */

import {
  FindingResponse,
  FindingsResponse,
  FindingStatus,
  FindingStatusUpdate,
  FindingStatusUpdateSchema,
  Severity,
  FindingCategory,
} from '../../schemas/discovery/findings.schemas';
import { FINDING_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing findings
 */
export interface ListFindingsParams {
  scan_job_id?: number;
  severity?: Severity;
  category?: FindingCategory;
  status?: FindingStatus;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all findings user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with findings response
 */
export const getFindings = async (params?: ListFindingsParams): Promise<FindingsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.scan_job_id) queryParams.append('scan_job_id', params.scan_job_id.toString());
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${FINDING_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FindingsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch findings',
      data: []
    };
  }
};

/**
 * Fetch a specific finding by ID
 * @param id Finding ID
 * @returns Promise with finding response
 */
export const getFinding = async (id: number): Promise<FindingResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FindingResponse>(FINDING_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch finding with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Update finding triage status via PATCH /{id}/status
 * @param id Finding ID
 * @param data Status update data
 * @returns Promise with finding response
 */
export const updateFindingStatus = async (id: number, data: FindingStatusUpdate): Promise<FindingResponse> => {
  // Validate request data
  FindingStatusUpdateSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<FindingResponse>(FINDING_ENDPOINTS.UPDATE_STATUS(id), {
      method: 'PATCH',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update finding status for ID ${id}`,
      data: undefined
    };
  }
};
