'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useScanJobStore } from '../../store/execution/scan-jobs.store';
import { type ScanJob } from '../../schemas/execution/scan-jobs.schemas';

/**
 * Context type for the scan jobs provider
 */
export interface ScanJobContextType {
  // State
  scanJobs: ScanJob[];
  activeScanJobId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveScanJob: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ScanJobContext = createContext<ScanJobContextType | null>(null);

/**
 * Provider component for scan job-related state and actions
 */
export function ScanJobProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    scanJobs,
    activeScanJobId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanJob,
    clearError
  } = useScanJobStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useScanJobStore.persist.rehydrate();
  }, []);

  // Initialize scan jobs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing scan jobs:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ScanJobContextType>(() => ({
    scanJobs,
    activeScanJobId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanJob,
    clearError
  }), [
    scanJobs,
    activeScanJobId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveScanJob,
    clearError
  ]);

  return (
    <ScanJobContext.Provider value={contextValue}>
      {children}
    </ScanJobContext.Provider>
  );
}

/**
 * Default export
 */
export default ScanJobProvider;
