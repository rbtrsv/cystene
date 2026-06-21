'use client';

import { AUDIT_TRAIL_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

/**
 * Audit log entry from the API
 */
export interface AuditLogEntry {
  id: number;
  organization_id: number | null;
  user_id: number | null;
  user_email: string | null;
  table_name: string | null;
  record_id: number | null;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  timestamp: string;
  ip_address: string | null;
}

/**
 * Response containing multiple audit log entries
 */
export interface AuditLogEntriesResponse {
  success: boolean;
  data: AuditLogEntry[] | null;
  count: number | null;
}

/**
 * Query parameters for listing audit logs
 */
export interface ListAuditLogsParams {
  organization_id?: number;
  table_name?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch audit log entries for the user's organizations.
 * Only shows changes made by the user's org(s).
 */
export const getAuditTrailEntries = async (
  params?: ListAuditLogsParams,
): Promise<AuditLogEntriesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.table_name) queryParams.append('table_name', params.table_name);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `${AUDIT_TRAIL_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    return await fetchClient<AuditLogEntriesResponse>(url);
  } catch {
    return {
      success: false,
      data: [],
      count: 0,
    };
  }
};

/**
 * Export audit logs as CSV file download.
 */
export const exportAuditTrail = async (params?: ListAuditLogsParams): Promise<void> => {
  const queryParams = new URLSearchParams();
  queryParams.append('format', 'csv');
  if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
  if (params?.table_name) queryParams.append('table_name', params.table_name);
  if (params?.action) queryParams.append('action', params.action);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const url = `${AUDIT_TRAIL_ENDPOINTS.EXPORT}?${queryParams.toString()}`;

  // Direct fetch for file download (not JSON)
  const { getAccessToken } = await import('../../../accounts/utils/token.client.utils');
  const token = getAccessToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `cystene-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
