'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useReportStore } from '../../store/discovery/reports.store';
import { type Report } from '../../schemas/discovery/reports.schemas';

/**
 * Context type for the reports provider
 */
export interface ReportContextType {
  // State
  reports: Report[];
  activeReportId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveReport: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const ReportContext = createContext<ReportContextType | null>(null);

/**
 * Provider component for report-related state and actions
 */
export function ReportProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    reports,
    activeReportId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveReport,
    clearError
  } = useReportStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useReportStore.persist.rehydrate();
  }, []);

  // Initialize reports on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing reports:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ReportContextType>(() => ({
    reports,
    activeReportId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveReport,
    clearError
  }), [
    reports,
    activeReportId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveReport,
    clearError
  ]);

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
}

/**
 * Default export
 */
export default ReportProvider;
