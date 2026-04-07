'use client';

import { useContext, useCallback } from 'react';
import { FindingContext, FindingContextType } from '../../providers/discovery/finding-provider';
import { useFindingStore } from '../../store/discovery/findings.store';
import {
  type Finding,
  type Severity,
  type FindingStatus,
  type FindingCategory
} from '../../schemas/discovery/findings.schemas';
import { ListFindingsParams } from '../../service/discovery/findings.service';

/**
 * Hook to use the finding context
 * @throws Error if used outside of a FindingProvider
 */
export function useFindingContext(): FindingContextType {
  const context = useContext(FindingContext);

  if (!context) {
    throw new Error('useFindingContext must be used within a FindingProvider');
  }

  return context;
}

/**
 * Custom hook that combines finding context and store
 * to provide a simplified interface for finding functionality
 *
 * @returns Finding utilities and state
 */
export function useFindings() {
  // Get data from finding context
  const {
    findings,
    activeFindingId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveFinding,
    clearError: clearContextError
  } = useFindingContext();

  // Get additional actions from finding store
  const {
    fetchFindings,
    fetchFinding,
    updateFindingStatus,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFindingStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active finding
  const activeFinding = findings.find((item: Finding) => item.id === activeFindingId) || null;

  return {
    // State
    findings,
    activeFindingId,
    activeFinding,
    isLoading,
    error,
    isInitialized,

    // Finding actions
    fetchFindings,
    fetchFinding,
    updateFindingStatus,
    setActiveFinding,
    initialize,
    clearError,

    // Helper methods — memoized so they can be used in useMemo dependency arrays
    getFindingById: useCallback((id: number) => {
      return findings.find((item: Finding) => item.id === id);
    }, [findings]),
    getFindingsBySeverity: useCallback((severity: Severity) => {
      return findings.filter((f: Finding) => f.severity === severity);
    }, [findings]),
    getFindingsByStatus: useCallback((status: FindingStatus) => {
      return findings.filter((f: Finding) => f.status === status);
    }, [findings]),
    getFindingsByCategory: useCallback((category: FindingCategory) => {
      return findings.filter((f: Finding) => f.category === category);
    }, [findings]),
    getFindingsByScanJob: useCallback((scanJobId: number) => {
      return findings.filter((f: Finding) => f.scan_job_id === scanJobId);
    }, [findings]),
    getOpenFindings: useCallback(() => {
      return findings.filter((f: Finding) => f.status === 'open');
    }, [findings]),
    getCriticalFindings: useCallback(() => {
      return findings.filter((f: Finding) => f.severity === 'critical');
    }, [findings]),
    getNewFindings: useCallback(() => {
      return findings.filter((f: Finding) => f.is_new);
    }, [findings]),

    // Convenience wrapper functions
    fetchFindingsWithFilters: async (filters: ListFindingsParams) => {
      return await fetchFindings(filters);
    }
  };
}

export default useFindings;
