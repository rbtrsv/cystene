'use client';

import { useContext } from 'react';
import { SubjectContext, SubjectContextType } from '@/modules/nexotype/providers/lims/subject-provider';
import { useSubjectStore } from '@/modules/nexotype/store/lims/subject.store';
import {
  type Subject,
  type CreateSubject,
  type UpdateSubject,
} from '@/modules/nexotype/schemas/lims/subject.schemas';
import { ListSubjectsParams } from '@/modules/nexotype/service/lims/subject.service';

/**
 * Hook to use the subject context
 * @throws Error if used outside of a SubjectProvider
 */
export function useSubjectContext(): SubjectContextType {
  const context = useContext(SubjectContext);

  if (!context) {
    throw new Error('useSubjectContext must be used within a SubjectProvider');
  }

  return context;
}

/**
 * Custom hook that combines subject context and store
 * to provide a simplified interface for subject functionality
 *
 * @returns Subject utilities and state
 */
export function useSubjects() {
  // Get data from subject context
  const {
    subjects,
    activeSubjectId,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    setActiveSubject,
    clearError: clearContextError,
  } = useSubjectContext();

  // Get additional actions from subject store
  const {
    fetchSubjects,
    fetchSubject,
    createSubject,
    updateSubject,
    deleteSubject,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError,
  } = useSubjectStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;

  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Get active subject
  const activeSubject = subjects.find((item: Subject) => item.id === activeSubjectId) || null;

  return {
    // State
    subjects,
    activeSubjectId,
    activeSubject,
    isLoading,
    error,
    isInitialized,

    // Subject actions
    fetchSubjects,
    fetchSubject,
    createSubject,
    updateSubject,
    deleteSubject,
    setActiveSubject,
    initialize,
    clearError,

    // Helper methods
    getById: (id: number) => {
      return subjects.find((item: Subject) => item.id === id);
    },

    // Convenience wrapper functions
    fetchWithFilters: async (filters: ListSubjectsParams) => {
      return await fetchSubjects(filters);
    },
    createWithData: async (data: CreateSubject) => {
      return await createSubject(data);
    },
    updateWithData: async (id: number, data: UpdateSubject) => {
      return await updateSubject(id, data);
    },
  };
}

export default useSubjects;
