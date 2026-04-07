'use client';

/**
 * Report Service
 *
 * List, detail, generate, delete operations for Report model.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/report_subrouter.py
 */

import {
  ReportResponse,
  ReportsResponse,
  CreateReport,
  CreateReportSchema,
} from '../../schemas/discovery/reports.schemas';
import { REPORT_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing reports
 */
export interface ListReportsParams {
  target_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all reports user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with reports response
 */
export const getReports = async (params?: ListReportsParams): Promise<ReportsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.target_id) queryParams.append('target_id', params.target_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${REPORT_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ReportsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
      data: []
    };
  }
};

/**
 * Fetch a specific report by ID
 * @param id Report ID
 * @returns Promise with report response
 */
export const getReport = async (id: number): Promise<ReportResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ReportResponse>(REPORT_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch report with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Generate a new report
 * @param data Report generation data
 * @returns Promise with report response
 */
export const generateReport = async (data: CreateReport): Promise<ReportResponse> => {
  // Validate request data
  CreateReportSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ReportResponse>(REPORT_ENDPOINTS.GENERATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
      data: undefined
    };
  }
};

/**
 * Delete a report (soft delete)
 * @param id Report ID
 * @returns Promise with success response
 */
export const deleteReport = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      REPORT_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete report with ID ${id}`
    };
  }
};
