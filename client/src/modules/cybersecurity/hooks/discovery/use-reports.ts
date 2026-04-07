'use client';

import { useContext, useCallback } from 'react';
import { ReportContext, ReportContextType } from '../../providers/discovery/report-provider';
import { useReportStore } from '../../store/discovery/reports.store';
import {
  type Report,
  type CreateReport
} from '../../schemas/discovery/reports.schemas';
import { ListReportsParams } from '../../service/discovery/reports.service';

/**
 * Hook to use the report context
 * @throws Error if used outside of a ReportProvider
 */
export function useReportContext(): ReportContextType {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }

  return context;
}

/**
 * Custom hook that combines report context and store
 * to provide a simplified interface for report functionality
 *
 * @returns Report utilities and state
 */
export function useReports() {
  // Get data from report context
  const {
    reports,
    activeReportId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveReport,
    clearError: clearContextError
  } = useReportContext();

  // Get additional actions from report store
  const {
    fetchReports,
    fetchReport,
    generateReport,
    deleteReport,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useReportStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active report
  const activeReport = reports.find((item: Report) => item.id === activeReportId) || null;

  return {
    // State
    reports,
    activeReportId,
    activeReport,
    isLoading,
    error,
    isInitialized,

    // Report actions
    fetchReports,
    fetchReport,
    generateReport,
    deleteReport,
    setActiveReport,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getReportById: useCallback((id: number) => {
      return reports.find((item: Report) => item.id === id);
    }, [reports]),
    getReportName: useCallback((id: number) => {
      const item = reports.find((r: Report) => r.id === id);
      return item ? item.name : 'Unknown Report';
    }, [reports]),
    getReportsByTarget: useCallback((targetId: number) => {
      return reports.filter((r: Report) => r.target_id === targetId);
    }, [reports]),
    getReportsByScanJob: useCallback((scanJobId: number) => {
      return reports.filter((r: Report) => r.scan_job_id === scanJobId);
    }, [reports]),

    // Convenience wrapper functions
    fetchReportsWithFilters: async (filters: ListReportsParams) => {
      return await fetchReports(filters);
    },
    generateReportWithData: async (data: CreateReport) => {
      return await generateReport(data);
    }
  };
}

export default useReports;
