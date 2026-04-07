'use client';

import { useContext, useCallback } from 'react';
import { ScanScheduleContext, ScanScheduleContextType } from '../../providers/execution/scan-schedule-provider';
import { useScanScheduleStore } from '../../store/execution/scan-schedules.store';
import {
  type ScanSchedule,
  type CreateScanSchedule,
  type UpdateScanSchedule
} from '../../schemas/execution/scan-schedules.schemas';
import { ListScanSchedulesParams } from '../../service/execution/scan-schedules.service';

/**
 * Hook to use the scan schedule context
 * @throws Error if used outside of a ScanScheduleProvider
 */
export function useScanScheduleContext(): ScanScheduleContextType {
  const context = useContext(ScanScheduleContext);

  if (!context) {
    throw new Error('useScanScheduleContext must be used within a ScanScheduleProvider');
  }

  return context;
}

/**
 * Custom hook that combines scan schedule context and store
 * to provide a simplified interface for scan schedule functionality
 *
 * @returns Scan schedule utilities and state
 */
export function useScanSchedules() {
  // Get data from scan schedule context
  const {
    scanSchedules,
    activeScanScheduleId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveScanSchedule,
    clearError: clearContextError
  } = useScanScheduleContext();

  // Get additional actions from scan schedule store
  const {
    fetchScanSchedules,
    fetchScanSchedule,
    createScanSchedule,
    updateScanSchedule,
    deleteScanSchedule,
    activateScanSchedule,
    deactivateScanSchedule,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useScanScheduleStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active scan schedule
  const activeScanSchedule = scanSchedules.find((item: ScanSchedule) => item.id === activeScanScheduleId) || null;

  return {
    // State
    scanSchedules,
    activeScanScheduleId,
    activeScanSchedule,
    isLoading,
    error,
    isInitialized,

    // Scan schedule actions
    fetchScanSchedules,
    fetchScanSchedule,
    createScanSchedule,
    updateScanSchedule,
    deleteScanSchedule,
    activateScanSchedule,
    deactivateScanSchedule,
    setActiveScanSchedule,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getScanScheduleById: useCallback((id: number) => {
      return scanSchedules.find((item: ScanSchedule) => item.id === id);
    }, [scanSchedules]),
    getScanScheduleName: useCallback((id: number) => {
      const item = scanSchedules.find((s: ScanSchedule) => s.id === id);
      return item ? item.name : 'Unknown Schedule';
    }, [scanSchedules]),
    getScanSchedulesByTarget: useCallback((targetId: number) => {
      return scanSchedules.filter((s: ScanSchedule) => s.target_id === targetId);
    }, [scanSchedules]),
    getActiveScanSchedules: useCallback(() => {
      return scanSchedules.filter((s: ScanSchedule) => s.is_active);
    }, [scanSchedules]),

    // Convenience wrapper functions
    fetchScanSchedulesWithFilters: async (filters: ListScanSchedulesParams) => {
      return await fetchScanSchedules(filters);
    },
    createScanScheduleWithData: async (data: CreateScanSchedule) => {
      return await createScanSchedule(data);
    },
    updateScanScheduleWithData: async (id: number, data: UpdateScanSchedule) => {
      return await updateScanSchedule(id, data);
    }
  };
}

export default useScanSchedules;
