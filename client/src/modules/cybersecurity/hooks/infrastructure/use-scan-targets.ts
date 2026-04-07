'use client';

import { useContext, useCallback } from 'react';
import { ScanTargetContext, ScanTargetContextType } from '../../providers/infrastructure/scan-target-provider';
import { useScanTargetStore } from '../../store/infrastructure/scan-targets.store';
import {
  type ScanTarget,
  type CreateScanTarget,
  type UpdateScanTarget,
  type TargetType
} from '../../schemas/infrastructure/scan-targets.schemas';
import { ListScanTargetsParams } from '../../service/infrastructure/scan-targets.service';

/**
 * Hook to use the scan target context
 * @throws Error if used outside of a ScanTargetProvider
 */
export function useScanTargetContext(): ScanTargetContextType {
  const context = useContext(ScanTargetContext);

  if (!context) {
    throw new Error('useScanTargetContext must be used within a ScanTargetProvider');
  }

  return context;
}

/**
 * Custom hook that combines scan target context and store
 * to provide a simplified interface for scan target functionality
 *
 * @returns Scan target utilities and state
 */
export function useScanTargets() {
  // Get data from scan target context
  const {
    scanTargets,
    activeScanTargetId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveScanTarget,
    clearError: clearContextError
  } = useScanTargetContext();

  // Get additional actions from scan target store
  const {
    fetchScanTargets,
    fetchScanTarget,
    createScanTarget,
    updateScanTarget,
    deleteScanTarget,
    verifyScanTarget,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useScanTargetStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active scan target
  const activeScanTarget = scanTargets.find((item: ScanTarget) => item.id === activeScanTargetId) || null;

  return {
    // State
    scanTargets,
    activeScanTargetId,
    activeScanTarget,
    isLoading,
    error,
    isInitialized,

    // Scan target actions
    fetchScanTargets,
    fetchScanTarget,
    createScanTarget,
    updateScanTarget,
    deleteScanTarget,
    verifyScanTarget,
    setActiveScanTarget,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getScanTargetById: useCallback((id: number) => {
      return scanTargets.find((item: ScanTarget) => item.id === id);
    }, [scanTargets]),
    getScanTargetName: useCallback((id: number) => {
      const item = scanTargets.find((t: ScanTarget) => t.id === id);
      return item ? item.name : 'Unknown Target';
    }, [scanTargets]),
    getScanTargetsByType: useCallback((targetType: TargetType) => {
      return scanTargets.filter((t: ScanTarget) => t.target_type === targetType);
    }, [scanTargets]),
    getVerifiedScanTargets: useCallback(() => {
      return scanTargets.filter((t: ScanTarget) => t.is_verified);
    }, [scanTargets]),

    // Convenience wrapper functions
    fetchScanTargetsWithFilters: async (filters: ListScanTargetsParams) => {
      return await fetchScanTargets(filters);
    },
    createScanTargetWithData: async (data: CreateScanTarget) => {
      return await createScanTarget(data);
    },
    updateScanTargetWithData: async (id: number, data: UpdateScanTarget) => {
      return await updateScanTarget(id, data);
    }
  };
}

export default useScanTargets;
