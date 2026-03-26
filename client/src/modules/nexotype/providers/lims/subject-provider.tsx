'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useSubjectStore } from '@/modules/nexotype/store/lims/subject.store';
import { type Subject } from '@/modules/nexotype/schemas/lims/subject.schemas';

/**
 * Context type for the subjects provider
 */
export interface SubjectContextType {
  // State
  subjects: Subject[];
  activeSubjectId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveSubject: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const SubjectContext = createContext<SubjectContextType | null>(null);

/**
 * Provider component for subject-related state and actions
 */
export function SubjectProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    subjects,
    activeSubjectId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSubject,
    clearError,
  } = useSubjectStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useSubjectStore.persist.rehydrate();
  }, []);

  // Initialize subjects on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing subjects:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SubjectContextType>(() => ({
    subjects,
    activeSubjectId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSubject,
    clearError,
  }), [
    subjects,
    activeSubjectId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveSubject,
    clearError,
  ]);

  return (
    <SubjectContext.Provider value={contextValue}>
      {children}
    </SubjectContext.Provider>
  );
}

/**
 * Default export
 */
export default SubjectProvider;
