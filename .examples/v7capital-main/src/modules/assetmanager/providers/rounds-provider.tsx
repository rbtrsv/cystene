'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useRoundsStore } from '../store/rounds.store';
import { 
  type Round, 
  type RoundWithFund, 
  type RoundWithSecurities, 
  type RoundWithDetails 
} from '../schemas/rounds.schemas';

/**
 * Context type for the rounds provider
 */
export interface RoundsContextType {
  // State
  rounds: Round[];
  selectedRound: Round | RoundWithFund | RoundWithSecurities | RoundWithDetails | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRounds: () => Promise<void>;
  fetchRoundsByFund: (fundId: number) => Promise<void>;
  fetchRound: (id: number) => Promise<void>;
  fetchRoundWithFund: (id: number) => Promise<void>;
  fetchRoundWithSecurities: (id: number) => Promise<void>;
  fetchRoundWithDetails: (id: number) => Promise<void>;
  setSelectedRound: (round: Round | RoundWithFund | RoundWithSecurities | RoundWithDetails | null) => void;
  clearError: () => void;
}

// Create the context
export const RoundsContext = createContext<RoundsContextType | null>(null);

/**
 * Provider component for rounds-related state and actions
 */
export function RoundsProvider({ 
  children,
  initialFetch = true,
  fundId
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
  fundId?: number;
}) {
  // Get state and actions from the store
  const {
    rounds,
    selectedRound,
    isLoading,
    error,
    fetchRounds,
    fetchRoundsByFund,
    fetchRound,
    fetchRoundWithFund,
    fetchRoundWithSecurities,
    fetchRoundWithDetails,
    setSelectedRound,
    clearError
  } = useRoundsStore();
  
  // Fetch rounds on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;
    
    if (initialFetch) {
      if (fundId) {
        fetchRoundsByFund(fundId).catch(error => {
          if (isMounted) {
            console.error('Error fetching rounds by fund:', error);
          }
        });
      } else {
        fetchRounds().catch(error => {
          if (isMounted) {
            console.error('Error fetching rounds:', error);
          }
        });
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialFetch, fundId, fetchRounds, fetchRoundsByFund]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RoundsContextType>(() => ({
    rounds,
    selectedRound,
    isLoading,
    error,
    fetchRounds,
    fetchRoundsByFund,
    fetchRound,
    fetchRoundWithFund,
    fetchRoundWithSecurities,
    fetchRoundWithDetails,
    setSelectedRound,
    clearError
  }), [
    rounds,
    selectedRound,
    isLoading,
    error,
    fetchRounds,
    fetchRoundsByFund,
    fetchRound,
    fetchRoundWithFund,
    fetchRoundWithSecurities,
    fetchRoundWithDetails,
    setSelectedRound,
    clearError
  ]);
  
  return (
    <RoundsContext.Provider value={contextValue}>
      {children}
    </RoundsContext.Provider>
  );
}

/**
 * Hook to use the rounds context
 * @throws Error if used outside of a RoundsProvider
 */
export function useRoundsContext(): RoundsContextType {
  const context = useContext(RoundsContext);
  
  if (!context) {
    throw new Error('useRoundsContext must be used within a RoundsProvider');
  }
  
  return context;
}
