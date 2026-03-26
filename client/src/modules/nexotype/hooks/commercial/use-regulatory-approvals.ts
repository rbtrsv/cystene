'use client';

import { useContext } from 'react';
import { RegulatoryApprovalContext, RegulatoryApprovalContextType } from '@/modules/nexotype/providers/commercial/regulatory-approval-provider';
import { useRegulatoryApprovalStore } from '@/modules/nexotype/store/commercial/regulatory-approval.store';
import {
  type RegulatoryApproval,
  type CreateRegulatoryApproval,
  type UpdateRegulatoryApproval,
} from '@/modules/nexotype/schemas/commercial/regulatory-approval.schemas';
import { ListRegulatoryApprovalsParams } from '@/modules/nexotype/service/commercial/regulatory-approval.service';

/**
 * Hook to use the regulatory approval context
 * @throws Error if used outside of a RegulatoryApprovalProvider
 */
export function useRegulatoryApprovalContext(): RegulatoryApprovalContextType {
  const context = useContext(RegulatoryApprovalContext);

  if (!context) {
    throw new Error('useRegulatoryApprovalContext must be used within a RegulatoryApprovalProvider');
  }

  return context;
}

/**
 * Custom hook that combines regulatory approval context and store
 * to provide a simplified interface for regulatory approval functionality
 *
 * @returns Regulatory approval utilities and state
 */
export function useRegulatoryApprovals() {
  // Get data from regulatory approval context
  const {
    regulatoryApprovals,
    activeRegulatoryApprovalId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveRegulatoryApproval,
    clearError: clearContextError,
  } = useRegulatoryApprovalContext();

  // Get additional actions from regulatory approval store
  const {
    fetchRegulatoryApprovals,
    fetchRegulatoryApproval,
    createRegulatoryApproval,
    updateRegulatoryApproval,
    deleteRegulatoryApproval,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useRegulatoryApprovalStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active regulatory approval
  const activeRegulatoryApproval = regulatoryApprovals.find((item: RegulatoryApproval) => item.id === activeRegulatoryApprovalId) || null;

  return {
    // State
    regulatoryApprovals,
    activeRegulatoryApprovalId,
    activeRegulatoryApproval,
    isLoading,
    error,
    isInitialized,

    // RegulatoryApproval actions
    fetchRegulatoryApprovals,
    fetchRegulatoryApproval,
    createRegulatoryApproval,
    updateRegulatoryApproval,
    deleteRegulatoryApproval,
    setActiveRegulatoryApproval,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return regulatoryApprovals.find((item: RegulatoryApproval) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListRegulatoryApprovalsParams) => {
      return await fetchRegulatoryApprovals(filters);
    },
    createWithData: async (data: CreateRegulatoryApproval) => {
      return await createRegulatoryApproval(data);
    },
    updateWithData: async (id: number, data: UpdateRegulatoryApproval) => {
      return await updateRegulatoryApproval(id, data);
    },
  };
}

export default useRegulatoryApprovals;
