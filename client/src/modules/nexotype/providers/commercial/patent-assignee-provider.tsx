'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePatentAssigneeStore } from '@/modules/nexotype/store/commercial/patent-assignee.store';
import { type PatentAssignee } from '@/modules/nexotype/schemas/commercial/patent-assignee.schemas';

/**
 * Context type for the patent assignees provider
 */
export interface PatentAssigneeContextType {
  // State
  patentAssignees: PatentAssignee[];
  activePatentAssigneeId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActivePatentAssignee: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const PatentAssigneeContext = createContext<PatentAssigneeContextType | null>(null);

/**
 * Provider component for patent assignee-related state and actions
 */
export function PatentAssigneeProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    patentAssignees,
    activePatentAssigneeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentAssignee,
    clearError,
  } = usePatentAssigneeStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    usePatentAssigneeStore.persist.rehydrate();
  }, []);

  // Initialize patent assignees on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing patent assignees:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PatentAssigneeContextType>(() => ({
    patentAssignees,
    activePatentAssigneeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentAssignee,
    clearError,
  }), [
    patentAssignees,
    activePatentAssigneeId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActivePatentAssignee,
    clearError,
  ]);

  return (
    <PatentAssigneeContext.Provider value={contextValue}>
      {children}
    </PatentAssigneeContext.Provider>
  );
}

/**
 * Default export
 */
export default PatentAssigneeProvider;
