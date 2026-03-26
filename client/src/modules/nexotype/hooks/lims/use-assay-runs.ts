'use client';

import { useContext } from 'react';
import { AssayRunContext, AssayRunContextType } from '@/modules/nexotype/providers/lims/assay-run-provider';
import { useAssayRunStore } from '@/modules/nexotype/store/lims/assay-run.store';
import {
  type AssayRun,
  type CreateAssayRun,
  type UpdateAssayRun,
} from '@/modules/nexotype/schemas/lims/assay-run.schemas';
import { ListAssayRunsParams } from '@/modules/nexotype/service/lims/assay-run.service';

/**
 * Hook to use the assay run context
 * @throws Error if used outside of a AssayRunProvider
 */
export function useAssayRunContext(): AssayRunContextType {
  const context = useContext(AssayRunContext);

  if (!context) {
    throw new Error('useAssayRunContext must be used within a AssayRunProvider');
  }

  return context;
}

/**
 * Custom hook that combines assay run context and store
 * to provide a simplified interface for assay run functionality
 *
 * @returns AssayRun utilities and state
 */
export function useAssayRuns() {
  // Get data from assay run context
  const {
    assayRuns,
    activeAssayRunId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAssayRun,
    clearError: clearContextError,
  } = useAssayRunContext();

  // Get additional actions from assay run store
  const {
    fetchAssayRuns,
    fetchAssayRun,
    createAssayRun,
    updateAssayRun,
    deleteAssayRun,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useAssayRunStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active assay run
  const activeAssayRun = assayRuns.find((item: AssayRun) => item.id === activeAssayRunId) || null;

  return {
    // State
    assayRuns,
    activeAssayRunId,
    activeAssayRun,
    isLoading,
    error,
    isInitialized,

    // AssayRun actions
    fetchAssayRuns,
    fetchAssayRun,
    createAssayRun,
    updateAssayRun,
    deleteAssayRun,
    setActiveAssayRun,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return assayRuns.find((item: AssayRun) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListAssayRunsParams) => {
      return await fetchAssayRuns(filters);
    },
    createWithData: async (data: CreateAssayRun) => {
      return await createAssayRun(data);
    },
    updateWithData: async (id: number, data: UpdateAssayRun) => {
      return await updateAssayRun(id, data);
    },
  };
}

export default useAssayRuns;
