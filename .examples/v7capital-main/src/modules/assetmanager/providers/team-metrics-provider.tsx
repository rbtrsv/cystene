'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTeamMetricsStore } from '../store/team-metrics.store';
import { type TeamMetrics } from '../schemas/team-metrics.schemas';

/**
 * Context type for the team metrics provider
 */
export interface TeamMetricsContextType {
  // State
  teamMetrics: TeamMetrics[];
  selectedTeamMetric: TeamMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTeamMetrics: (companyId?: number) => Promise<boolean>;
  fetchTeamMetric: (id: number) => Promise<boolean>;
  setSelectedTeamMetric: (teamMetric: TeamMetrics | null) => void;
  clearError: () => void;
}

// Create the context
export const TeamMetricsContext = createContext<TeamMetricsContextType | null>(null);

/**
 * Provider component for team metrics-related state and actions
 */
export function TeamMetricsProvider({ 
  children,
  initialFetch = true,
  companyId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  companyId?: number;
}) {
  // Get state and actions from the store
  const {
    teamMetrics,
    selectedTeamMetric,
    isLoading,
    error,
    fetchTeamMetrics,
    fetchTeamMetric,
    setSelectedTeamMetric,
    clearError
  } = useTeamMetricsStore();
  
  // Fetch team metrics on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      fetchTeamMetrics(companyId).catch(error => {
        if (isMounted) {
          console.error('Error fetching team metrics:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, companyId, fetchTeamMetrics]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TeamMetricsContextType>(() => ({
    teamMetrics,
    selectedTeamMetric,
    isLoading,
    error,
    fetchTeamMetrics,
    fetchTeamMetric,
    setSelectedTeamMetric,
    clearError
  }), [
    teamMetrics,
    selectedTeamMetric,
    isLoading,
    error,
    fetchTeamMetrics,
    fetchTeamMetric,
    setSelectedTeamMetric,
    clearError
  ]);
  
  return (
    <TeamMetricsContext.Provider value={contextValue}>
      {children}
    </TeamMetricsContext.Provider>
  );
}

/**
 * Hook to use the team metrics context
 * @throws Error if used outside of a TeamMetricsProvider
 */
export function useTeamMetricsContext(): TeamMetricsContextType {
  const context = useContext(TeamMetricsContext);
  
  if (!context) {
    throw new Error('useTeamMetricsContext must be used within a TeamMetricsProvider');
  }
  
  return context;
}