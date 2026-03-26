'use client';

import { useContext } from 'react';
import {
  AssayProtocolContext,
  AssayProtocolContextType,
} from '@/modules/nexotype/providers/lims/assay-protocol-provider';
import { useAssayProtocolStore } from '@/modules/nexotype/store/lims/assay-protocol.store';
import {
  type AssayProtocol,
  type CreateAssayProtocol,
  type UpdateAssayProtocol,
} from '@/modules/nexotype/schemas/lims/assay-protocol.schemas';
import { ListAssayProtocolsParams } from '@/modules/nexotype/service/lims/assay-protocol.service';

/**
 * Hook to use the assay protocol context
 * @throws Error if used outside of a AssayProtocolProvider
 */
export function useAssayProtocolContext(): AssayProtocolContextType {
  const context = useContext(AssayProtocolContext);

  if (!context) {
    throw new Error('useAssayProtocolContext must be used within a AssayProtocolProvider');
  }

  return context;
}

/**
 * Custom hook that combines assay protocol context and store
 * to provide a simplified interface for assay protocol functionality
 *
 * @returns AssayProtocol utilities and state
 */
export function useAssayProtocols() {
  // Get data from assay protocol context
  const {
    assayProtocols,
    activeAssayProtocolId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveAssayProtocol,
    clearError: clearContextError,
  } = useAssayProtocolContext();

  // Get additional actions from assay protocol store
  const {
    fetchAssayProtocols,
    fetchAssayProtocol,
    createAssayProtocol,
    updateAssayProtocol,
    deleteAssayProtocol,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useAssayProtocolStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active assay protocol
  const activeAssayProtocol =
    assayProtocols.find((item: AssayProtocol) => item.id === activeAssayProtocolId) || null;

  return {
    // State
    assayProtocols,
    activeAssayProtocolId,
    activeAssayProtocol,
    isLoading,
    error,
    isInitialized,

    // AssayProtocol actions
    fetchAssayProtocols,
    fetchAssayProtocol,
    createAssayProtocol,
    updateAssayProtocol,
    deleteAssayProtocol,
    setActiveAssayProtocol,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return assayProtocols.find((item: AssayProtocol) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListAssayProtocolsParams) => {
      return await fetchAssayProtocols(filters);
    },
    createWithData: async (data: CreateAssayProtocol) => {
      return await createAssayProtocol(data);
    },
    updateWithData: async (id: number, data: UpdateAssayProtocol) => {
      return await updateAssayProtocol(id, data);
    },
  };
}

export default useAssayProtocols;
