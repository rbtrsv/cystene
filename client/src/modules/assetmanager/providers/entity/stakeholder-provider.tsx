'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useStakeholderStore } from '../../store/entity/stakeholder.store';
import { type Stakeholder } from '../../schemas/entity/stakeholder.schemas';

/**
 * Context type for the stakeholders provider
 */
export interface StakeholderContextType {
  // State
  stakeholders: Stakeholder[];
  activeStakeholderId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveStakeholder: (stakeholderId: number | null) => void;
  clearError: () => void;
}

// Create the context
export const StakeholderContext = createContext<StakeholderContextType | null>(null);

/**
 * Provider component for stakeholder-related state and actions
 */
export function StakeholderProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    stakeholders,
    activeStakeholderId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveStakeholder,
    clearError
  } = useStakeholderStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useStakeholderStore.persist.rehydrate();
  }, []);

  // Initialize stakeholders on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing stakeholders:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<StakeholderContextType>(() => ({
    stakeholders,
    activeStakeholderId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveStakeholder,
    clearError
  }), [
    stakeholders,
    activeStakeholderId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveStakeholder,
    clearError
  ]);

  return (
    <StakeholderContext.Provider value={contextValue}>
      {children}
    </StakeholderContext.Provider>
  );
}

/**
 * Default export
 */
export default StakeholderProvider;
