'use client';

import { useRoundsContext } from '../providers/rounds-provider';
import { useRoundsStore } from '../store/rounds.store';
import { 
  type Round, 
  type RoundWithFund, 
  type RoundWithSecurities, 
  type RoundWithDetails,
  type RoundType
} from '../schemas/rounds.schemas';

/**
 * Custom hook that combines round context and store
 * to provide a simplified interface for round functionality
 * 
 * @returns Round utilities and state
 */
export function useRounds() {
  // Get data from round context
  const {
    rounds,
    selectedRound,
    isLoading: contextLoading,
    error: contextError,
    fetchRounds,
    fetchRoundsByFund,
    fetchRound,
    fetchRoundWithFund,
    fetchRoundWithSecurities,
    fetchRoundWithDetails,
    setSelectedRound,
    clearError: clearContextError
  } = useRoundsContext();

  // Get additional actions from round store
  const {
    addRound,
    editRound,
    removeRound,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useRoundsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    rounds,
    selectedRound,
    isLoading,
    error,
    
    // Round actions
    fetchRounds,
    fetchRoundsByFund,
    fetchRound,
    fetchRoundWithFund,
    fetchRoundWithSecurities,
    fetchRoundWithDetails,
    addRound,
    editRound,
    removeRound,
    setSelectedRound,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasRounds: () => rounds.length > 0,
    getRoundById: (id: number) => rounds.find(r => r.id === id),
    getRoundName: (id: number) => {
      const round = rounds.find(r => r.id === id);
      return round ? round.roundName : 'Unknown Round';
    },
    getRoundType: (id: number): RoundType | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.roundType : null;
    },
    getRoundDate: (id: number): Date | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.roundDate : null;
    },
    getRoundWithFund: (id: number): RoundWithFund | null => {
      if (selectedRound && selectedRound.id === id && 'fund' in selectedRound) {
        return selectedRound as RoundWithFund;
      }
      return null;
    },
    getRoundWithSecurities: (id: number): RoundWithSecurities | null => {
      if (selectedRound && selectedRound.id === id && 'securities' in selectedRound) {
        return selectedRound as RoundWithSecurities;
      }
      return null;
    },
    getRoundWithDetails: (id: number): RoundWithDetails | null => {
      if (selectedRound && selectedRound.id === id && 'fund' in selectedRound && 'securities' in selectedRound) {
        return selectedRound as RoundWithDetails;
      }
      return null;
    },
    getRoundTargetAmount: (id: number): number | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.targetAmount : null;
    },
    getRoundRaisedAmount: (id: number): number | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.raisedAmount : null;
    },
    getRoundPreMoneyValuation: (id: number): number | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.preMoneyValuation : null;
    },
    getRoundPostMoneyValuation: (id: number): number | null => {
      const round = rounds.find(r => r.id === id);
      return round ? round.postMoneyValuation : null;
    },
    getRoundsByFundId: (fundId: number): Round[] => {
      return rounds.filter(r => r.fundId === fundId);
    }
  };
}

export default useRounds;
