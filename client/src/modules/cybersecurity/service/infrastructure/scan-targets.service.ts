'use client';

/**
 * Scan Target Service
 *
 * CRUD operations + verify for ScanTarget model.
 *
 * Backend: /server/apps/cybersecurity/subrouters/infrastructure_subrouters/scan_target_subrouter.py
 */

import {
  ScanTargetResponse,
  ScanTargetsResponse,
  CreateScanTarget,
  UpdateScanTarget,
  CreateScanTargetSchema,
  UpdateScanTargetSchema,
  TargetType,
} from '../../schemas/infrastructure/scan-targets.schemas';
import { SCAN_TARGET_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing scan targets
 */
export interface ListScanTargetsParams {
  target_type?: TargetType;
  infrastructure_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all scan targets user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with scan targets response
 */
export const getScanTargets = async (params?: ListScanTargetsParams): Promise<ScanTargetsResponse> => {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.target_type) queryParams.append('target_type', params.target_type);
    if (params?.infrastructure_id) queryParams.append('infrastructure_id', params.infrastructure_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SCAN_TARGET_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanTargetsResponse>(url, {
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
      error: error instanceof Error ? error.message : 'Failed to fetch scan targets',
      data: []
    };
  }
};

/**
 * Fetch a specific scan target by ID
 * @param id Scan target ID
 * @returns Promise with scan target response
 */
export const getScanTarget = async (id: number): Promise<ScanTargetResponse> => {
  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanTargetResponse>(SCAN_TARGET_ENDPOINTS.DETAIL(id), {
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
      error: error instanceof Error ? error.message : `Failed to fetch scan target with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new scan target
 * @param data Scan target creation data
 * @returns Promise with scan target response
 */
export const createScanTarget = async (data: CreateScanTarget): Promise<ScanTargetResponse> => {
  // Validate request data
  CreateScanTargetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanTargetResponse>(SCAN_TARGET_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scan target',
      data: undefined
    };
  }
};

/**
 * Update an existing scan target
 * @param id Scan target ID
 * @param data Scan target update data
 * @returns Promise with scan target response
 */
export const updateScanTarget = async (id: number, data: UpdateScanTarget): Promise<ScanTargetResponse> => {
  // Validate request data
  UpdateScanTargetSchema.parse(data);

  try {
    // FastAPI returns full response wrapper {success, data, error}
    const response = await fetchClient<ScanTargetResponse>(SCAN_TARGET_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update scan target with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a scan target (soft delete)
 * @param id Scan target ID
 * @returns Promise with success response
 */
export const deleteScanTarget = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // FastAPI returns {success: bool, message?: string, error?: string}
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SCAN_TARGET_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete scan target with ID ${id}`
    };
  }
};

/**
 * Verify ownership of a scan target
 * @param id Scan target ID
 * @param verificationMethod Verification method: "dns_txt", "file_upload", or "meta_tag"
 * @returns Promise with verification response (includes instructions if failed)
 */
export const verifyScanTarget = async (
  id: number,
  verificationMethod: string = 'dns_txt'
): Promise<{ success: boolean; message?: string; error?: string; instructions?: string; token?: string; is_verified?: boolean }> => {
  try {
    // Build query string with verification method
    const url = `${SCAN_TARGET_ENDPOINTS.VERIFY(id)}?verification_method=${verificationMethod}`;
    const response = await fetchClient<{ success: boolean; message?: string; instructions?: string; token?: string; is_verified?: boolean }>(
      url,
      {
        method: 'POST'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to verify scan target with ID ${id}`
    };
  }
};
