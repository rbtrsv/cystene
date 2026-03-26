'use client';

import { useInvestmentPortfolioContext } from '@/modules/assetmanager/providers/portfolio-investment-provider';
import { useInvestmentPortfolioStore } from '@/modules/assetmanager/store/portfolio-investment.store';
import {
  type InvestmentPortfolio,
  type InvestmentPortfolioWithRelations,
  type CreateInvestmentPortfolioInput,
  type UpdateInvestmentPortfolioInput,
  type PortfolioStatus,
  type InvestmentType,
  type SectorType
} from '@/modules/assetmanager/schemas/portfolio-investment.schemas';

/**
 * Custom hook that combines investment portfolio context and store
 * to provide a simplified interface for investment portfolio functionality
 * 
 * @returns Investment portfolio utilities and state
 */
export function useInvestmentPortfolio() {
  // Get data from investment portfolio context
  const {
    portfolios,
    portfoliosWithRelations,
    selectedPortfolio,
    totalFundUnits,
    isLoading: contextLoading,
    error: contextError,
    fetchPortfolios,
    fetchPortfoliosWithRelations,
    fetchPortfolio,
    fetchPortfoliosByCompany,
    fetchPortfoliosByFund,
    fetchFundUnits,
    setSelectedPortfolio,
    clearError: clearContextError
  } = useInvestmentPortfolioContext();

  // Get additional actions from investment portfolio store
  const {
    addPortfolio,
    editPortfolio,
    removePortfolio,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useInvestmentPortfolioStore();

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
    portfolios,
    portfoliosWithRelations,
    selectedPortfolio,
    totalFundUnits,
    isLoading,
    error,

    // Portfolio actions
    fetchPortfolios,
    fetchPortfoliosWithRelations,
    fetchPortfolio,
    addPortfolio,
    editPortfolio,
    removePortfolio,
    setSelectedPortfolio,

    // Filter actions
    fetchPortfoliosByCompany,
    fetchPortfoliosByFund,

    // Fund units actions
    fetchFundUnits,

    // Utility actions
    clearError,
    
    // Helper methods
    hasPortfolios: () => portfolios.length > 0,
    getPortfolioById: (id: number) => portfolios.find(p => p.id === id),
    
    // Get portfolios by company
    getPortfoliosByCompany: (companyId: number) => 
      portfolios.filter(p => p.companyId === companyId),
    
    // Get portfolios by fund
    getPortfoliosByFund: (fundId: number) => 
      portfolios.filter(p => p.fundId === fundId),
    
    // Get portfolios by round
    getPortfoliosByRound: (roundId: number) => 
      portfolios.filter(p => p.roundId === roundId),
    
    // Get portfolios by status
    getPortfoliosByStatus: (status: PortfolioStatus) => 
      portfolios.filter(p => p.portfolioStatus === status),
    
    // Get portfolios by investment type
    getPortfoliosByInvestmentType: (type: InvestmentType) => 
      portfolios.filter(p => p.investmentType === type),
    
    // Get portfolios by sector
    getPortfoliosBySector: (sector: SectorType) => 
      portfolios.filter(p => p.sector === sector),
    
    // Calculate total investment amount
    getTotalInvestmentAmount: () => {
      return portfolios.reduce((total, portfolio) => {
        const amount = portfolio.investmentAmount || 0;
        return total + amount;
      }, 0);
    },
    
    // Calculate total current value
    getTotalCurrentValue: () => {
      return portfolios.reduce((total, portfolio) => {
        const value = portfolio.currentFairValue || 0;
        return total + value;
      }, 0);
    },

    // Calculate total unrealized gains/losses
    getTotalUnrealizedGains: () => {
      return portfolios.reduce((total, portfolio) => {
        const invested = portfolio.investmentAmount || 0;
        const current = portfolio.currentFairValue || 0;
        return total + (current - invested);
      }, 0);
    },
    
    // Calculate portfolio performance metrics
    getPortfolioMetrics: () => {
      const totalInvested = portfolios.reduce((total, p) => {
        return total + (p.investmentAmount || 0);
      }, 0);
      
      const totalCurrentValue = portfolios.reduce((total, p) => {
        return total + (p.currentFairValue || 0);
      }, 0);
      
      const totalUnrealizedGains = totalCurrentValue - totalInvested;
      const totalReturn = totalInvested > 0 ? (totalUnrealizedGains / totalInvested) * 100 : 0;
      const weightedAverageIRR = portfolios.filter(p => 
        p.irr && 
        p.irr !== 0 && 
        p.investmentAmount && 
        p.investmentAmount > 0
      ).length > 0 ? (() => {
        const portfoliosWithIRR = portfolios.filter(p => 
          p.irr && 
          p.irr !== 0 && 
          p.investmentAmount && 
          p.investmentAmount > 0
        );
        const weightedSum = portfoliosWithIRR.reduce((sum, p) => {
          const irr = p.irr!;
          const investment = p.investmentAmount!;
          return sum + (irr * investment);
        }, 0);
        const totalInvestment = portfoliosWithIRR.reduce((sum, p) => {
          return sum + p.investmentAmount!;
        }, 0);
        return weightedSum / totalInvestment;
      })() : 0;
      
      return {
        totalInvested,
        totalCurrentValue,
        totalUnrealizedGains,
        totalReturn,
        weightedAverageIRR,
        portfolioCount: portfolios.length,
        activePortfolios: portfolios.filter(p => p.portfolioStatus === 'Active').length,
        exitedPortfolios: portfolios.filter(p => p.portfolioStatus === 'Exited').length
      };
    },
    
    // Get company name from portfolios with relations
    getCompanyName: (companyId: number) => {
      const portfolio = portfoliosWithRelations.find(p => p.companyId === companyId);
      return portfolio?.company?.name || 'Unknown Company';
    },
    
    // Get fund name from portfolios with relations
    getFundName: (fundId: number) => {
      const portfolio = portfoliosWithRelations.find(p => p.fundId === fundId);
      return portfolio?.fund?.name || 'Unknown Fund';
    },
    
    // Get round name from portfolios with relations
    getRoundName: (roundId: number) => {
      const portfolio = portfoliosWithRelations.find(p => p.roundId === roundId);
      return portfolio?.round?.name || 'Unknown Round';
    },
    
    // Check if a portfolio has positive returns
    hasPositiveReturns: (portfolioId: number) => {
      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (!portfolio?.investmentAmount || !portfolio?.currentFairValue) return false;

      const invested = portfolio.investmentAmount;
      const current = portfolio.currentFairValue;
      return current > invested;
    },

    // Get portfolio return percentage
    getPortfolioReturn: (portfolioId: number) => {
      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (!portfolio?.investmentAmount || !portfolio?.currentFairValue) return 0;

      const invested = portfolio.investmentAmount;
      const current = portfolio.currentFairValue;

      if (invested === 0) return 0;
      return ((current - invested) / invested) * 100;
    },

    // Calculate MOIC automatically based on current fair value and investment
    calculateMOIC: (portfolioId: number) => {
      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (!portfolio?.investmentAmount || !portfolio?.currentFairValue) return 0;

      const investment = portfolio.investmentAmount;
      const currentFairValue = portfolio.currentFairValue;

      if (investment === 0) return 0;
      return currentFairValue / investment;
    },

    // Calculate weighted average IRR based on investment amounts
    getWeightedAverageIRR: () => {
      const portfoliosWithIRR = portfolios.filter(p => 
        p.irr && 
        p.irr !== 0 && 
        p.investmentAmount && 
        p.investmentAmount > 0
      );
      
      if (portfoliosWithIRR.length === 0) return 0;
      
      // Calculate weighted average: sum(IRR * investment_amount) / sum(investment_amount)
      const weightedSum = portfoliosWithIRR.reduce((sum, p) => {
        const irr = p.irr!;
        const investment = p.investmentAmount!;
        return sum + (irr * investment);
      }, 0);
      
      const totalInvestment = portfoliosWithIRR.reduce((sum, p) => {
        return sum + p.investmentAmount!;
      }, 0);
      
      return weightedSum / totalInvestment;
    },
  };
}

export default useInvestmentPortfolio;
