'use client';

import { useContext } from 'react';
import {
  AssayReadoutContext,
  AssayReadoutContextType,
} from '@/modules/nexotype/providers/lims/assay-readout-provider';
import { useAssayReadoutStore } from '@/modules/nexotype/store/lims/assay-readout.store';
import {
  type AssayReadout,
  type CreateAssayReadout,
  type UpdateAssayReadout,
} from '@/modules/nexotype/schemas/lims/assay-readout.schemas';
import { ListAssayReadoutsParams } from '@/modules/nexotype/service/lims/assay-readout.service';

/**
 * Hook to use the assay readout context
 * @throws Error if used outside of a AssayReadoutProvider
 */
export function useAssayReadoutContext(): AssayReadoutContextType {
  const context = useContext(AssayReadoutContext);

  if (!context) {
    throw new Error('useAssayReadoutContext must be used within a AssayReadoutProvider');
  }

  return context;
}

/**
 * Custom hook that combines assay readout context and store
 * to provide a simplified interface for assay readout functionality
 *
 * @returns AssayReadout utilities and state
 */
export function useAssayReadouts() {
  // Get data from assay readout context
  const {
    assayReadouts,
    activeAssayReadoutId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAssayReadout,
    clearError: clearContextError,
  } = useAssayReadoutContext();

  // Get additional actions from assay readout store
  const {
    fetchAssayReadouts,
    fetchAssayReadout,
    createAssayReadout,
    updateAssayReadout,
    deleteAssayReadout,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useAssayReadoutStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active assay readout
  const activeAssayReadout =
    assayReadouts.find((item: AssayReadout) => item.id === activeAssayReadoutId) || null;

  return {
    // State
    assayReadouts,
    activeAssayReadoutId,
    activeAssayReadout,
    isLoading,
    error,
    isInitialized,

    // AssayReadout actions
    fetchAssayReadouts,
    fetchAssayReadout,
    createAssayReadout,
    updateAssayReadout,
    deleteAssayReadout,
    setActiveAssayReadout,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return assayReadouts.find((item: AssayReadout) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListAssayReadoutsParams) => {
      return await fetchAssayReadouts(filters);
    },
    createWithData: async (data: CreateAssayReadout) => {
      return await createAssayReadout(data);
    },
    updateWithData: async (id: number, data: UpdateAssayReadout) => {
      return await updateAssayReadout(id, data);
    },
  };
}

export default useAssayReadouts;
