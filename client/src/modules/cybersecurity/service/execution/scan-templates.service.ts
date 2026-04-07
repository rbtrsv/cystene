'use client';

/**
 * Scan Template Service
 *
 * CRUD operations for ScanTemplate model.
 *
 * Backend: /server/apps/cybersecurity/subrouters/execution_subrouters/scan_template_subrouter.py
 */

import {
  ScanTemplateResponse,
  ScanTemplatesResponse,
  CreateScanTemplate,
  UpdateScanTemplate,
  CreateScanTemplateSchema,
  UpdateScanTemplateSchema,
} from '../../schemas/execution/scan-templates.schemas';
import { SCAN_TEMPLATE_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing scan templates
 */
export interface ListScanTemplatesParams {
  target_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all scan templates user has access to
 * @param params Optional query parameters for filtering
 * @returns Promise with scan templates response
 */
export const getScanTemplates = async (params?: ListScanTemplatesParams): Promise<ScanTemplatesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.target_id) queryParams.append('target_id', params.target_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${SCAN_TEMPLATE_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchClient<ScanTemplatesResponse>(url, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scan templates',
      data: []
    };
  }
};

/**
 * Fetch a specific scan template by ID
 * @param id Scan template ID
 * @returns Promise with scan template response
 */
export const getScanTemplate = async (id: number): Promise<ScanTemplateResponse> => {
  try {
    const response = await fetchClient<ScanTemplateResponse>(SCAN_TEMPLATE_ENDPOINTS.DETAIL(id), {
      method: 'GET'
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch scan template with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Create a new scan template
 * @param data Scan template creation data
 * @returns Promise with scan template response
 */
export const createScanTemplate = async (data: CreateScanTemplate): Promise<ScanTemplateResponse> => {
  CreateScanTemplateSchema.parse(data);

  try {
    const response = await fetchClient<ScanTemplateResponse>(SCAN_TEMPLATE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scan template',
      data: undefined
    };
  }
};

/**
 * Update an existing scan template
 * @param id Scan template ID
 * @param data Scan template update data
 * @returns Promise with scan template response
 */
export const updateScanTemplate = async (id: number, data: UpdateScanTemplate): Promise<ScanTemplateResponse> => {
  UpdateScanTemplateSchema.parse(data);

  try {
    const response = await fetchClient<ScanTemplateResponse>(SCAN_TEMPLATE_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update scan template with ID ${id}`,
      data: undefined
    };
  }
};

/**
 * Delete a scan template (soft delete)
 * @param id Scan template ID
 * @returns Promise with success response
 */
export const deleteScanTemplate = async (id: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetchClient<{ success: boolean; message?: string; error?: string }>(
      SCAN_TEMPLATE_ENDPOINTS.DELETE(id),
      {
        method: 'DELETE'
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete scan template with ID ${id}`
    };
  }
};
