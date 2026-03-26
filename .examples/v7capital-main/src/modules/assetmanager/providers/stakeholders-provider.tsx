'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useStakeholdersStore } from '../store/stakeholders.store';
import { type Stakeholder, type StakeholderWithUsers, type StakeholderUserWithProfile } from '../schemas/stakeholders.schemas';

/**
 * Context type for the stakeholders provider
 */
export interface StakeholdersContextType {
  // State
  stakeholders: Stakeholder[];
  selectedStakeholder: StakeholderWithUsers | null;
  stakeholderUsers: StakeholderUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStakeholders: () => Promise<void>;
  fetchStakeholder: (id: number) => Promise<void>;
  setSelectedStakeholder: (stakeholder: Stakeholder | null) => void;
  clearError: () => void;
}

// Create the context
export const StakeholdersContext = createContext<StakeholdersContextType | null>(null);

/**
 * Provider component for stakeholders-related state and actions
 */
export function StakeholdersProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    stakeholders,
    selectedStakeholder,
    stakeholderUsers,
    isLoading,
    error,
    fetchStakeholders,
    fetchStakeholder,
    setSelectedStakeholder,
    clearError
  } = useStakeholdersStore();
  
  // Fetch stakeholders on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchStakeholders().catch(error => {
        if (isMounted) {
          console.error('Error fetching stakeholders:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fetchStakeholders]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<StakeholdersContextType>(() => ({
    stakeholders,
    selectedStakeholder,
    stakeholderUsers,
    isLoading,
    error,
    fetchStakeholders,
    fetchStakeholder,
    setSelectedStakeholder,
    clearError
  }), [
    stakeholders,
    selectedStakeholder,
    stakeholderUsers,
    isLoading,
    error,
    fetchStakeholders,
    fetchStakeholder,
    setSelectedStakeholder,
    clearError
  ]);
  
  return (
    <StakeholdersContext.Provider value={contextValue}>
      {children}
    </StakeholdersContext.Provider>
  );
}

/**
 * Hook to use the stakeholders context
 * @throws Error if used outside of a StakeholdersProvider
 */
export function useStakeholdersContext(): StakeholdersContextType {
  const context = useContext(StakeholdersContext);
  
  if (!context) {
    throw new Error('useStakeholdersContext must be used within a StakeholdersProvider');
  }
  
  return context;
}
