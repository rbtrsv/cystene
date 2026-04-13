'use client';

/**
 * Export utilities for downloading PDF/CSV files from export endpoints.
 *
 * Uses fetch with auth token directly (not fetchCybersecurity) because
 * export endpoints return binary blobs, not JSON.
 * Appends organization_id manually for multi-org context.
 */

import { getAccessToken } from '../../accounts/utils/token.client.utils';
import { useOrganizationStore } from '../../accounts/store/organizations.store';

/**
 * Download an export file (PDF or CSV) from the given URL.
 *
 * @param url - Full export endpoint URL (without format param)
 * @param fileName - Base filename without extension (e.g., "findings")
 * @param format - Export format: "pdf" or "csv"
 */
export const downloadExport = async (
  url: string,
  fileName: string,
  format: 'pdf' | 'csv',
): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Append format param
  const separator = url.includes('?') ? '&' : '?';
  let fullUrl = `${url}${separator}format=${format}`;

  // Append organization_id for multi-org context
  const activeOrganizationId = useOrganizationStore.getState().activeOrganizationId;
  if (activeOrganizationId) {
    fullUrl += `&organization_id=${activeOrganizationId}`;
  }

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Export failed with status ${response.status}`);
  }

  // Create blob and trigger browser download
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${fileName}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};
