'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useScanScheduleStore } from '../../store/execution/scan-schedules.store';
import { type ScanSchedule } from '../../schemas/execution/scan-schedules.schemas';

/**
 * Context type for the scan schedules provider
 */
export interface ScanScheduleContextType {
  // State
  scanSchedules: ScanSchedule[];
  activeScanScheduleId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveScanSchedule: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ScanScheduleContext = createContext<ScanScheduleContextType | null>(null);

/**
 * Provider component for scan schedule-related state and actions
 */
export function ScanScheduleProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    scanSchedules,
    activeScanScheduleId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanSchedule,
    clearError
  } = useScanScheduleStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useScanScheduleStore.persist.rehydrate();
  }, []);

  // Initialize scan schedules on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing scan schedules:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ScanScheduleContextType>(() => ({
    scanSchedules,
    activeScanScheduleId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanSchedule,
    clearError
  }), [
    scanSchedules,
    activeScanScheduleId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanSchedule,
    clearError
  ]);

  return (
    <ScanScheduleContext.Provider value={contextValue}>
      {children}
    </ScanScheduleContext.Provider>
  );
}

/**
 * Default export
 */
export default ScanScheduleProvider;
