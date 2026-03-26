'use client';

import { useFundsContext } from '../providers/funds-provider';
import { useFundsStore } from '../store/funds.store';
import { 
  type Fund, 
  type FundWithStakeholders, 
  type FundWithRounds,
  type FundStatus
} from '../schemas/funds.schemas';

/**
 * Custom hook that combines fund context and store
 * to provide a simplified interface for fund functionality
 * 
 * @returns Fund utilities and state
 */
export function useFunds() {
  // Get data from fund context
  const {
    funds,
    selectedFund,
    isLoading: contextLoading,
    error: contextError,
    fetchFunds,
    fetchFund,
    fetchFundWithStakeholders,
    fetchFundWithRounds,
    setSelectedFund,
    clearError: clearContextError
  } = useFundsContext();

  // Get additional actions from fund store
  const {
    addFund,
    editFund,
    removeFund,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFundsStore();

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
    funds,
    selectedFund,
    isLoading,
    error,

    // Fund actions
    fetchFunds,
    fetchFund,
    fetchFundWithStakeholders,
    fetchFundWithRounds,
    addFund,
    editFund,
    removeFund,
    setSelectedFund,
    
    // Utility actions
    clearError,
    
    // Helper methods
    hasFunds: () => funds.length > 0,
    getFundById: (id: number) => funds.find(f => f.id === id),
    getFundName: (id: number) => {
      const fund = funds.find(f => f.id === id);
      return fund ? fund.name : 'Unknown Fund';
    },
    getFundStatus: (id: number): FundStatus | null => {
      const fund = funds.find(f => f.id === id);
      return fund ? fund.status : null;
    },
    getFundWithStakeholders: (id: number): FundWithStakeholders | null => {
      if (selectedFund && selectedFund.id === id && 'stakeholders' in selectedFund) {
        return selectedFund as FundWithStakeholders;
      }
      return null;
    },
    getFundWithRounds: (id: number): FundWithRounds | null => {
      if (selectedFund && selectedFund.id === id && 'rounds' in selectedFund) {
        return selectedFund as FundWithRounds;
      }
      return null;
    },
    getFundTargetSize: (id: number): number | null => {
      const fund = funds.find(f => f.id === id);
      return fund ? fund.targetSize : null;
    },
    getFundVintage: (id: number): number | null => {
      const fund = funds.find(f => f.id === id);
      return fund ? fund.vintage : null;
    }
  };
}

export default useFunds;
