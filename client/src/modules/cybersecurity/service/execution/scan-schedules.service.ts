'use client';

/**
 * Scan Schedule Service
 *
 * CRUD operations + activate/deactivate for ScanSchedule model.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_schedule_subrouter.py
 */

import {
  ScanScheduleResponse,
  ScanSchedulesResponse,
  CreateScanSchedule,
  UpdateScanSchedule,
  CreateScanScheduleSchema,
  UpdateScanScheduleSchema,
} from '../../schemas/execution/scan-schedules.schemas';
import { SCAN_SCHEDULE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing scan schedules
 */
export interface ListScanSchedulesParams {
  target_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all scan schedules user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with scan schedules response
 */
export const getScanSchedules = async (params?: ListScanSchedulesParams): Promise<ScanSchedulesResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.target_id) queryParams.append('target_id', params.target_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SCAN_SCHEDULE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanSchedulesResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch scan schedules',
      data: []
    };
  }
};

/**
 * Fetch a specific scan schedule by ID
 * @param id Scan schedule ID
 * @returns Promise with scan schedule response
 */
export const getScanSchedule = async (id: number): Promise<ScanScheduleResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanScheduleResponse>(SCAN_SCHEDULE_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch scan schedule with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new scan schedule
 * @param data Scan schedule creation data
 * @returns Promise with scan schedule response
 */
export const createScanSchedule = async (data: CreateScanSchedule): Promise<ScanScheduleResponse> => {
  // Validate request data
  CreateScanScheduleSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanScheduleResponse>(SCAN_SCHEDULE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scan schedule',
      data: undefined
    };
  }
};

/**
 * Update an existing scan schedule
 * @param id Scan schedule ID
 * @param data Scan schedule update data
 * @returns Promise with scan schedule response
 */
export const updateScanSchedule = async (id: number, data: UpdateScanSchedule): Promise<ScanScheduleResponse> => {
  // Validate request data
  UpdateScanScheduleSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanScheduleResponse>(SCAN_SCHEDULE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update scan schedule with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a scan schedule (soft delete)
 * @param id Scan schedule ID
 * @returns Promise with success response
 */
export const deleteScanSchedule = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SCAN_SCHEDULE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete scan schedule with ID ${id}`
    };
  }
};

/**
 * Activate a scan schedule
 * @param id Scan schedule ID
 * @returns Promise with scan schedule response
 */
export const activateScanSchedule = async (id: number): Promise<ScanScheduleResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanScheduleResponse>(SCAN_SCHEDULE_ENDPOINTS.ACTIVATE(id), {
      method: 'POST'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to activate scan schedule with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Deactivate a scan schedule
 * @param id Scan schedule ID
 * @returns Promise with scan schedule response
 */
export const deactivateScanSchedule = async (id: number): Promise<ScanScheduleResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanScheduleResponse>(SCAN_SCHEDULE_ENDPOINTS.DEACTIVATE(id), {
      method: 'POST'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to deactivate scan schedule with ID ${id}`,
      data: undefined
    };
  }
};
