'use client';

/**
 * Scan Job Service
 *
 * List, detail, start, cancel operations for ScanJob model.
 * No create/update — jobs are created via POST /start and are immutable once started.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_job_subrouter.py
 */

import {
  ScanJobResponse,
  ScanJobsResponse,
} from '../../schemas/execution/scan-jobs.schemas';
import { SCAN_JOB_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing scan jobs
 */
export interface ListScanJobsParams {
  target_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all scan jobs user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with scan jobs response
 */
export const getScanJobs = async (params?: ListScanJobsParams): Promise<ScanJobsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.target_id) queryParams.append('target_id', params.target_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SCAN_JOB_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanJobsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch scan jobs',
      data: []
    };
  }
};

/**
 * Fetch a specific scan job by ID
 * @param id Scan job ID
 * @returns Promise with scan job response
 */
export const getScanJob = async (id: number): Promise<ScanJobResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanJobResponse>(SCAN_JOB_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch scan job with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Start a new scan — creates ScanJob with status=pending and launches scanner dispatcher
 * @param targetId Scan target ID
 * @param templateId Scan template ID
 * @returns Promise with scan job response (job in pending status)
 */
export const startScan = async (targetId: number, templateId: number): Promise<ScanJobResponse> => {
  try {
    // POST /start expects query params target_id and template_id
    const queryParams = new URLSearchParams();
    queryParams.append('target_id', targetId.toString());
    queryParams.append('template_id', templateId.toString());

    const url = `${SCAN_JOB_ENDPOINTS.START}?${queryParams.toString()}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanJobResponse>(url, {
      method: 'POST'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start scan',
      data: undefined
    };
  }
};

/**
 * Cancel a running or pending scan job
 * @param id Scan job ID
 * @returns Promise with scan job response
 */
export const cancelScan = async (id: number): Promise<ScanJobResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanJobResponse>(SCAN_JOB_ENDPOINTS.CANCEL(id), {
      method: 'POST'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to cancel scan job with ID ${id}`,
      data: undefined
    };
  }
};
