'use client';

import { usePortfolioCashFlowContext } from '../providers/portfolio-cash-flow-provider';
import { usePortfolioCashFlowStore } from '../store/portfolio-cash-flow.store';
import {
  type PortfolioCashFlow,
  type PortfolioCashFlowWithRelations,
  type CreatePortfolioCashFlowInput,
  type UpdatePortfolioCashFlowInput,
  type CashFlowType,
  type CashFlowScenario
} from '../schemas/portfolio-cash-flow.schemas';

/**
 * Custom hook that combines portfolio cash flow context and store
 * to provide a simplified interface for portfolio cash flow functionality
 * 
 * @returns Portfolio cash flow utilities and state
 */
export function usePortfolioCashFlow() {
  // Get data from portfolio cash flow context
  const {
    cashFlows,
    cashFlowsWithRelations,
    selectedCashFlow,
    isLoading: contextLoading,
    error: contextError,
    fetchCashFlows,
    fetchCashFlowsWithRelations,
    fetchCashFlow,
    fetchCashFlowsByCompany,
    fetchCashFlowsByFund,
    fetchCashFlowsByRound,
    setSelectedCashFlow,
    clearError: clearContextError
  } = usePortfolioCashFlowContext();

  // Get additional actions from portfolio cash flow store
  const {
    addCashFlow,
    editCashFlow,
    removeCashFlow,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = usePortfolioCashFlowStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Helper functions for better UX
  const helpers = {
    /**
     * Get a cash flow by ID
     */
    getCashFlowById: (id: number): PortfolioCashFlow | undefined => {
      return cashFlows.find(cf => cf.id === id);
    },

    /**
     * Get cash flows by company ID
     */
    getCashFlowsByCompany: (companyId: number): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.companyId === companyId);
    },

    /**
     * Get cash flows by fund ID
     */
    getCashFlowsByFund: (fundId: number): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.fundId === fundId);
    },

    /**
     * Get cash flows by round ID
     */
    getCashFlowsByRound: (roundId: number): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.roundId === roundId);
    },

    /**
     * Get cash flows by type
     */
    getCashFlowsByType: (type: CashFlowType): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.cashFlowType === type);
    },

    /**
     * Get cash flows by scenario
     */
    getCashFlowsByScenario: (scenario: CashFlowScenario): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.scenario === scenario);
    },

    /**
     * Get actual cash flows
     */
    getActualCashFlows: (): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.scenario === 'Actual');
    },

    /**
     * Get forecast cash flows
     */
    getForecastCashFlows: (): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.scenario === 'Forecast');
    },

    /**
     * Get cash flows that should be included in IRR calculation
     */
    getIrrCashFlows: (): PortfolioCashFlow[] => {
      return cashFlows.filter(cf => cf.includeInIrr);
    },

    /**
     * Calculate total cash flow amount for a set of cash flows
     * Returns net amount (credit - debit for positive inflows)
     */
    calculateTotalAmount: (cashFlowList: PortfolioCashFlow[]): number => {
      return cashFlowList.reduce((total, cf) => {
        const debit = cf.amountDebit || 0;
        const credit = cf.amountCredit || 0;
        const netAmount = credit - debit;
        return total + netAmount;
      }, 0);
    },

    /**
     * Calculate gross amount (debit + credit) for reporting purposes
     */
    calculateGrossAmount: (cashFlowList: PortfolioCashFlow[]): number => {
      return cashFlowList.reduce((total, cf) => {
        const debit = cf.amountDebit || 0;
        const credit = cf.amountCredit || 0;
        const grossAmount = debit + credit;
        return total + grossAmount;
      }, 0);
    },

    /**
     * Get total invested amount for a company
     */
    getTotalInvestedByCompany: (companyId: number): number => {
      const investmentFlows = cashFlows.filter(cf => 
        cf.companyId === companyId && 
        (cf.cashFlowType === 'Investment' || cf.cashFlowType === 'Follow-on') &&
        cf.scenario === 'Actual'
      );
      return helpers.calculateTotalAmount(investmentFlows);
    },

    /**
     * Get total returns for a company
     */
    getTotalReturnsByCompany: (companyId: number): number => {
      const returnFlows = cashFlows.filter(cf => 
        cf.companyId === companyId && 
        (cf.cashFlowType === 'Dividend' || cf.cashFlowType === 'Sale Proceeds' || cf.cashFlowType === 'Exit Proceeds') &&
        cf.scenario === 'Actual'
      );
      return helpers.calculateTotalAmount(returnFlows);
    },

    /**
     * Get net cash flow for a company (returns minus investments)
     */
    getNetCashFlowByCompany: (companyId: number): number => {
      const returns = helpers.getTotalReturnsByCompany(companyId);
      const investments = helpers.getTotalInvestedByCompany(companyId);
      return returns - investments;
    },

    /**
     * Check if there are any cash flows
     */
    hasCashFlows: (): boolean => {
      return cashFlows.length > 0;
    },

    /**
     * Check if there are any cash flows for a specific company
     */
    hasCompanyCashFlows: (companyId: number): boolean => {
      return cashFlows.some(cf => cf.companyId === companyId);
    },

    /**
     * Get unique companies that have cash flows
     */
    getCompaniesWithCashFlows: (): number[] => {
      const companyIds = new Set(cashFlows.map(cf => cf.companyId));
      return Array.from(companyIds);
    },

    /**
     * Get unique funds that have cash flows
     */
    getFundsWithCashFlows: (): number[] => {
      const fundIds = new Set(cashFlows.map(cf => cf.fundId));
      return Array.from(fundIds);
    },

    /**
     * Sort cash flows by date (newest first)
     */
    sortByDateDesc: (cashFlowList: PortfolioCashFlow[]): PortfolioCashFlow[] => {
      return [...cashFlowList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    /**
     * Sort cash flows by date (oldest first)
     */
    sortByDateAsc: (cashFlowList: PortfolioCashFlow[]): PortfolioCashFlow[] => {
      return [...cashFlowList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    /**
     * Sort cash flows by amount (highest first)
     * Uses net amount (credit - debit)
     */
    sortByAmountDesc: (cashFlowList: PortfolioCashFlow[]): PortfolioCashFlow[] => {
      return [...cashFlowList].sort((a, b) => {
        const netA = (a.amountCredit || 0) - (a.amountDebit || 0);
        const netB = (b.amountCredit || 0) - (b.amountDebit || 0);
        return netB - netA;
      });
    }
  };

  return {
    // State
    cashFlows,
    cashFlowsWithRelations,
    selectedCashFlow,
    isLoading,
    error,
    
    // Core actions
    fetchCashFlows,
    fetchCashFlowsWithRelations,
    fetchCashFlow,
    addCashFlow,
    editCashFlow,
    removeCashFlow,
    
    // Filter actions
    fetchCashFlowsByCompany,
    fetchCashFlowsByFund,
    fetchCashFlowsByRound,
    
    // Utility actions
    setSelectedCashFlow,
    clearError,
    
    // Helper functions
    ...helpers
  };
}
