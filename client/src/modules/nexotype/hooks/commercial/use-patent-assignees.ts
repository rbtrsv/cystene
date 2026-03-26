'use client';

import { useContext } from 'react';
import { PatentAssigneeContext, PatentAssigneeContextType } from '@/modules/nexotype/providers/commercial/patent-assignee-provider';
import { usePatentAssigneeStore } from '@/modules/nexotype/store/commercial/patent-assignee.store';
import {
  type PatentAssignee,
  type CreatePatentAssignee,
  type UpdatePatentAssignee,
} from '@/modules/nexotype/schemas/commercial/patent-assignee.schemas';
import { ListPatentAssigneesParams } from '@/modules/nexotype/service/commercial/patent-assignee.service';

/**
 * Hook to use the patent assignee context
 * @throws Error if used outside of a PatentAssigneeProvider
 */
export function usePatentAssigneeContext(): PatentAssigneeContextType {
  const context = useContext(PatentAssigneeContext);

  if (!context) {
    throw new Error('usePatentAssigneeContext must be used within a PatentAssigneeProvider');
  }

  return context;
}

/**
 * Custom hook that combines patent assignee context and store
 * to provide a simplified interface for patent assignee functionality
 *
 * @returns Patent assignee utilities and state
 */
export function usePatentAssignees() {
  // Get data from patent assignee context
  const {
    patentAssignees,
    activePatentAssigneeId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActivePatentAssignee,
    clearError: clearContextError,
  } = usePatentAssigneeContext();

  // Get additional actions from patent assignee store
  const {
    fetchPatentAssignees,
    fetchPatentAssignee,
    createPatentAssignee,
    updatePatentAssignee,
    deletePatentAssignee,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = usePatentAssigneeStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active patent assignee
  const activePatentAssignee = patentAssignees.find((item: PatentAssignee) => item.id === activePatentAssigneeId) || null;

  return {
    // State
    patentAssignees,
    activePatentAssigneeId,
    activePatentAssignee,
    isLoading,
    error,
    isInitialized,

    // PatentAssignee actions
    fetchPatentAssignees,
    fetchPatentAssignee,
    createPatentAssignee,
    updatePatentAssignee,
    deletePatentAssignee,
    setActivePatentAssignee,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return patentAssignees.find((item: PatentAssignee) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListPatentAssigneesParams) => {
      return await fetchPatentAssignees(filters);
    },
    createWithData: async (data: CreatePatentAssignee) => {
      return await createPatentAssignee(data);
    },
    updateWithData: async (id: number, data: UpdatePatentAssignee) => {
      return await updatePatentAssignee(id, data);
    },
  };
}

export default usePatentAssignees;
