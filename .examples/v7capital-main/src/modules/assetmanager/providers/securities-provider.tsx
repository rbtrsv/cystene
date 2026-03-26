'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSecuritiesStore } from '../store/securities.store';
import { 
  type Security,
  type CreateSecurityInput,
  type UpdateSecurityInput
} from '../schemas/securities.schemas';

/**
 * Context type for the securities provider
 */
export interface SecuritiesContextType {
  // State
  securities: Security[];
  selectedSecurity: Security | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSecurities: () => Promise<void>;
  fetchSecuritiesByRound: (roundId: number) => Promise<void>;
  fetchSecurity: (id: number) => Promise<void>;
  addSecurity: (data: CreateSecurityInput) => Promise<boolean>;
  editSecurity: (id: number, data: UpdateSecurityInput) => Promise<boolean>;
  removeSecurity: (id: number) => Promise<boolean>;
  setSelectedSecurity: (security: Security | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Create the context
export const SecuritiesContext = createContext<SecuritiesContextType | null>(null);

/**
 * Provider component for securities-related state and actions
 */
export function SecuritiesProvider({ 
  children,
  initialFetch = true,
  roundId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  roundId?: number;
}) {
  // Get state and actions from the store
  const {
    securities,
    selectedSecurity,
    isLoading,
    error,
    fetchSecurities,
    fetchSecuritiesByRound,
    fetchSecurity,
    addSecurity,
    editSecurity,
    removeSecurity,
    setSelectedSecurity,
    clearError,
    reset
  } = useSecuritiesStore();
  
  // Fetch securities on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      const fetchData = async () => {
        if (roundId) {
          await fetchSecuritiesByRound(roundId);
        } else {
          await fetchSecurities();
        }
      };
      
      fetchData().catch(error => {
        if (isMounted) {
          console.error('Error fetching securities:', error);
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
    };
  }, [initialFetch, roundId, fetchSecurities, fetchSecuritiesByRound]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SecuritiesContextType>(() => ({
    securities,
    selectedSecurity,
    isLoading,
    error,
    fetchSecurities,
    fetchSecuritiesByRound,
    fetchSecurity,
    addSecurity,
    editSecurity,
    removeSecurity,
    setSelectedSecurity,
    clearError,
    reset
  }), [
    securities,
    selectedSecurity,
    isLoading,
    error,
    fetchSecurities,
    fetchSecuritiesByRound,
    fetchSecurity,
    addSecurity,
    editSecurity,
    removeSecurity,
    setSelectedSecurity,
    clearError,
    reset
  ]);
  
  return (
    <SecuritiesContext.Provider value={contextValue}>
      {children}
    </SecuritiesContext.Provider>
  );
}

/**
 * Hook to use the securities context
 * @throws Error if used outside of a SecuritiesProvider
 */
export function useSecuritiesContext(): SecuritiesContextType {
  const context = useContext(SecuritiesContext);
  
  if (!context) {
    throw new Error('useSecuritiesContext must be used within a SecuritiesProvider');
  }
  
  return context;
}
