'use client';

import { useContext, useCallback } from 'react';
import { ScanJobContext, ScanJobContextType } from '../../providers/execution/scan-job-provider';
import { useScanJobStore } from '../../store/execution/scan-jobs.store';
import {
  type ScanJob,
  type JobStatus
} from '../../schemas/execution/scan-jobs.schemas';
import { ListScanJobsParams } from '../../service/execution/scan-jobs.service';

/**
 * Hook to use the scan job context
 * @throws Error if used outside of a ScanJobProvider
 */
export function useScanJobContext(): ScanJobContextType {
  const context = useContext(ScanJobContext);

  if (!context) {
    throw new Error('useScanJobContext must be used within a ScanJobProvider');
  }

  return context;
}

/**
 * Custom hook that combines scan job context and store
 * to provide a simplified interface for scan job functionality
 *
 * @returns Scan job utilities and state
 */
export function useScanJobs() {
  // Get data from scan job context
  const {
    scanJobs,
    activeScanJobId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveScanJob,
    clearError: clearContextError
  } = useScanJobContext();

  // Get additional actions from scan job store
  const {
    fetchScanJobs,
    fetchScanJob,
    startScan,
    cancelScan,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useScanJobStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active scan job
  const activeScanJob = scanJobs.find((item: ScanJob) => item.id === activeScanJobId) || null;

  return {
    // State
    scanJobs,
    activeScanJobId,
    activeScanJob,
    isLoading,
    error,
    isInitialized,

    // Scan job actions
    fetchScanJobs,
    fetchScanJob,
    startScan,
    cancelScan,
    setActiveScanJob,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getScanJobById: useCallback((id: number) => {
      return scanJobs.find((item: ScanJob) => item.id === id);
    }, [scanJobs]),
    getScanJobsByTarget: useCallback((targetId: number) => {
      return scanJobs.filter((j: ScanJob) => j.target_id === targetId);
    }, [scanJobs]),
    getScanJobsByStatus: useCallback((status: JobStatus) => {
      return scanJobs.filter((j: ScanJob) => j.status === status);
    }, [scanJobs]),
    getRunningJobs: useCallback(() => {
      return scanJobs.filter((j: ScanJob) => j.status === 'running');
    }, [scanJobs]),
    getCompletedJobs: useCallback(() => {
      return scanJobs.filter((j: ScanJob) => j.status === 'completed');
    }, [scanJobs]),

    // Convenience wrapper functions
    fetchScanJobsWithFilters: async (filters: ListScanJobsParams) => {
      return await fetchScanJobs(filters);
    }
  };
}

export default useScanJobs;
