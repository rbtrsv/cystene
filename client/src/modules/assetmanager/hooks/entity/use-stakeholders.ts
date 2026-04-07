'use client';

import { useContext } from 'react';
import { StakeholderContext, StakeholderContextType } from '../../providers/entity/stakeholder-provider';
import { useStakeholderStore } from '../../store/entity/stakeholder.store';
import {
  type Stakeholder,
  type CreateStakeholder,
  type UpdateStakeholder,
  type StakeholderType
} from '../../schemas/entity/stakeholder.schemas';
import { ListStakeholdersParams } from '../../service/entity/stakeholder.service';

/**
 * Hook to use the stakeholder context
 * @throws Error if used outside of a StakeholderProvider
 */
export function useStakeholderContext(): StakeholderContextType {
  const context = useContext(StakeholderContext);

  if (!context) {
    throw new Error('useStakeholderContext must be used within a StakeholderProvider');
  }

  return context;
}

/**
 * Custom hook that combines stakeholder context and store
 * to provide a simplified interface for stakeholder functionality
 *
 * @returns Stakeholder utilities and state
 */
export function useStakeholders() {
  // Get data from stakeholder context
  const {
    stakeholders,
    activeStakeholderId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveStakeholder,
    clearError: clearContextError
  } = useStakeholderContext();

  // Get additional actions from stakeholder store
  const {
    fetchStakeholders,
    fetchStakeholder,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useStakeholderStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active stakeholder
  const activeStakeholder = stakeholders.find((stakeholder: Stakeholder) => stakeholder.id === activeStakeholderId) || null;

  return {
    // State
    stakeholders,
    activeStakeholderId,
    activeStakeholder,
    isLoading,
    error,
    isInitialized,

    // Stakeholder actions
    fetchStakeholders,
    fetchStakeholder,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    setActiveStakeholder,
    initialize,
    clearError,

    // Helper methods
    getStakeholderById: (id: number) => {
      return stakeholders.find((stakeholder: Stakeholder) => stakeholder.id === id);
    },
    getStakeholdersByType: (stakeholderType: StakeholderType) => {
      return stakeholders.filter((s: Stakeholder) => s.type === stakeholderType);
    },
    getStakeholdersByEntity: (entityId: number) => {
      return stakeholders.filter((s: Stakeholder) => s.entity_id === entityId);
    },

    // Convenience wrapper functions
    fetchStakeholdersWithFilters: async (filters: ListStakeholdersParams) => {
      return await fetchStakeholders(filters);
    },
    createStakeholderWithData: async (data: CreateStakeholder) => {
      return await createStakeholder(data);
    },
    updateStakeholderWithData: async (id: number, data: UpdateStakeholder) => {
      return await updateStakeholder(id, data);
    }
  };
}

export default useStakeholders;
