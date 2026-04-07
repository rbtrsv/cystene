'use client';

import { useContext, useCallback } from 'react';
import { ScanTemplateContext, ScanTemplateContextType } from '../../providers/execution/scan-template-provider';
import { useScanTemplateStore } from '../../store/execution/scan-templates.store';
import {
  type ScanTemplate,
  type CreateScanTemplate,
  type UpdateScanTemplate
} from '../../schemas/execution/scan-templates.schemas';
import { ListScanTemplatesParams } from '../../service/execution/scan-templates.service';

/**
 * Hook to use the scan template context
 * @throws Error if used outside of a ScanTemplateProvider
 */
export function useScanTemplateContext(): ScanTemplateContextType {
  const context = useContext(ScanTemplateContext);

  if (!context) {
    throw new Error('useScanTemplateContext must be used within a ScanTemplateProvider');
  }

  return context;
}

/**
 * Custom hook that combines scan template context and store
 * to provide a simplified interface for scan template functionality
 *
 * @returns Scan template utilities and state
 */
export function useScanTemplates() {
  // Get data from scan template context
  const {
    scanTemplates,
    activeScanTemplateId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveScanTemplate,
    clearError: clearContextError
  } = useScanTemplateContext();

  // Get additional actions from scan template store
  const {
    fetchScanTemplates,
    fetchScanTemplate,
    createScanTemplate,
    updateScanTemplate,
    deleteScanTemplate,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useScanTemplateStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active scan template
  const activeScanTemplate = scanTemplates.find((item: ScanTemplate) => item.id === activeScanTemplateId) || null;

  return {
    // State
    scanTemplates,
    activeScanTemplateId,
    activeScanTemplate,
    isLoading,
    error,
    isInitialized,

    // Scan template actions
    fetchScanTemplates,
    fetchScanTemplate,
    createScanTemplate,
    updateScanTemplate,
    deleteScanTemplate,
    setActiveScanTemplate,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getScanTemplateById: useCallback((id: number) => {
      return scanTemplates.find((item: ScanTemplate) => item.id === id);
    }, [scanTemplates]),
    getScanTemplateName: useCallback((id: number) => {
      const item = scanTemplates.find((t: ScanTemplate) => t.id === id);
      return item ? item.name : 'Unknown Template';
    }, [scanTemplates]),
    getScanTemplatesByTarget: useCallback((targetId: number) => {
      return scanTemplates.filter((t: ScanTemplate) => t.target_id === targetId);
    }, [scanTemplates]),

    // Convenience wrapper functions
    fetchScanTemplatesWithFilters: async (filters: ListScanTemplatesParams) => {
      return await fetchScanTemplates(filters);
    },
    createScanTemplateWithData: async (data: CreateScanTemplate) => {
      return await createScanTemplate(data);
    },
    updateScanTemplateWithData: async (id: number, data: UpdateScanTemplate) => {
      return await updateScanTemplate(id, data);
    }
  };
}

export default useScanTemplates;
