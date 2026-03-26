'use client';

import { usePortfolioPerformanceContext } from '../providers/portfolio-performance-provider';
import { usePortfolioPerformanceStore } from '../store/portfolio-performance.store';
import { 
  type CreatePortfolioPerformanceInput, 
  type UpdatePortfolioPerformanceInput
} from '../schemas/portfolio-performance.schemas';

/**
 * Custom hook that combines portfolio performance context and store
 * to provide a simplified interface for portfolio performance functionality
 * 
 * @returns Portfolio performance utilities and state
 */
export function usePortfolioPerformance() {
  // Get data from portfolio performance context
  const {
    portfolioPerformances,
    selectedPortfolioPerformance,
    isLoading: contextLoading,
    error: contextError,
    fetchPortfolioPerformances,
    fetchPortfolioPerformance,
    setSelectedPortfolioPerformance,
    clearError: clearContextError
  } = usePortfolioPerformanceContext();

  // Get additional actions from portfolio performance store
  const {
    createPortfolioPerformance,
    updatePortfolioPerformance,
    deletePortfolioPerformance,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = usePortfolioPerformanceStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addPortfolioPerformance = async (data: CreatePortfolioPerformanceInput): Promise<boolean> => {
    return await createPortfolioPerformance(data);
  };

  const editPortfolioPerformance = async (id: number, data: UpdatePortfolioPerformanceInput): Promise<boolean> => {
    return await updatePortfolioPerformance(id, data);
  };

  const removePortfolioPerformance = async (id: number): Promise<boolean> => {
    return await deletePortfolioPerformance(id);
  };

  return {
    // State
    portfolioPerformances,
    selectedPortfolioPerformance,
    isLoading,
    error,
    
    // Actions
    fetchPortfolioPerformances,
    fetchPortfolioPerformance,
    addPortfolioPerformance,
    editPortfolioPerformance,
    removePortfolioPerformance,
    setSelectedPortfolioPerformance,
    clearError,
    
    // Helper methods
    hasPortfolioPerformances: () => portfolioPerformances.length > 0,
    getPortfolioPerformanceById: (id: number) => portfolioPerformances.find(pp => pp.id === id),
    
    // Filter helpers
    getPortfolioPerformancesByFund: (fundId: number) => 
      portfolioPerformances.filter(pp => pp.fundId === fundId),
    
    getPortfolioPerformancesByRound: (roundId: number) => 
      portfolioPerformances.filter(pp => pp.roundId === roundId),
    
    getPortfolioPerformancesByDateRange: (startDate: string, endDate: string) => 
      portfolioPerformances.filter(pp => {
        const reportDate = new Date(pp.reportDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return reportDate >= start && reportDate <= end;
      }),
    
    getLatestPortfolioPerformances: () => {
      const sorted = [...portfolioPerformances].sort((a, b) => 
        new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );
      return sorted;
    },
    
    // Performance calculation helpers
    getTotalInvestedAmount: () => {
      return portfolioPerformances.reduce((total, pp) => {
        return total + pp.totalInvestedAmount;
      }, 0);
    },
    
    getTotalFairValue: () => {
      return portfolioPerformances.reduce((total, pp) => {
        return total + pp.fairValue;
      }, 0);
    },
    
    getTotalCashRealized: () => {
      return portfolioPerformances.reduce((total, pp) => {
        return total + pp.cashRealized;
      }, 0);
    },
    
    getWeightedAverageTVPI: () => {
      const performancesWithTVPI = portfolioPerformances.filter(pp => 
        pp.tvpi && pp.tvpi !== 0 && pp.totalInvestedAmount > 0
      );
      
      if (performancesWithTVPI.length === 0) return 0;
      
      const weightedSum = performancesWithTVPI.reduce((sum, pp) => {
        const tvpi = pp.tvpi!;
        const investment = pp.totalInvestedAmount;
        return sum + (tvpi * investment);
      }, 0);
      
      const totalInvestment = performancesWithTVPI.reduce((sum, pp) => {
        return sum + pp.totalInvestedAmount;
      }, 0);
      
      return weightedSum / totalInvestment;
    },
    
    getWeightedAverageDPI: () => {
      const performancesWithDPI = portfolioPerformances.filter(pp => 
        pp.dpi && pp.dpi !== 0 && pp.totalInvestedAmount > 0
      );
      
      if (performancesWithDPI.length === 0) return 0;
      
      const weightedSum = performancesWithDPI.reduce((sum, pp) => {
        const dpi = pp.dpi!;
        const investment = pp.totalInvestedAmount;
        return sum + (dpi * investment);
      }, 0);
      
      const totalInvestment = performancesWithDPI.reduce((sum, pp) => {
        return sum + pp.totalInvestedAmount;
      }, 0);
      
      return weightedSum / totalInvestment;
    },
    
    getWeightedAverageIRR: () => {
      const performancesWithIRR = portfolioPerformances.filter(pp => 
        pp.irr && pp.irr !== 0 && pp.totalInvestedAmount > 0
      );
      
      if (performancesWithIRR.length === 0) return 0;
      
      const weightedSum = performancesWithIRR.reduce((sum, pp) => {
        const irr = pp.irr!;
        const investment = pp.totalInvestedAmount;
        return sum + (irr * investment);
      }, 0);
      
      const totalInvestment = performancesWithIRR.reduce((sum, pp) => {
        return sum + pp.totalInvestedAmount;
      }, 0);
      
      return weightedSum / totalInvestment;
    },
    
    // Calculate portfolio metrics summary
    getPortfolioMetrics: () => {
      const totalInvested = portfolioPerformances.reduce((sum, pp) => {
        return sum + pp.totalInvestedAmount;
      }, 0);
      
      const totalFairValue = portfolioPerformances.reduce((sum, pp) => {
        return sum + pp.fairValue;
      }, 0);
      
      const totalCashRealized = portfolioPerformances.reduce((sum, pp) => {
        return sum + pp.cashRealized;
      }, 0);
      
      const totalValue = totalFairValue + totalCashRealized;
      const netGain = totalValue - totalInvested;
      const netReturn = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;
      
      return {
        totalInvested,
        totalFairValue,
        totalCashRealized,
        totalValue,
        netGain,
        netReturn,
        performanceCount: portfolioPerformances.length
      };
    },
    
    // Formatting helpers
    formatCurrency: (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },
    
    formatPercentage: (percentage: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(percentage / 100);
    },
    
    formatMultiple: (multiple: number): string => {
      return `${multiple.toFixed(2)}x`;
    },
    
    formatDate: (date: Date | string): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    // Performance analysis helpers
    getPerformanceTrend: (fundId?: number, roundId?: number) => {
      let filtered = portfolioPerformances;
      
      if (fundId) {
        filtered = filtered.filter(pp => pp.fundId === fundId);
      }
      
      if (roundId) {
        filtered = filtered.filter(pp => pp.roundId === roundId);
      }
      
      const sorted = filtered.sort((a, b) => 
        new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
      );
      
      return sorted.map(pp => ({
        date: pp.reportDate,
        tvpi: pp.tvpi || 0,
        dpi: pp.dpi || 0,
        irr: pp.irr || 0,
        fairValue: pp.fairValue,
        totalValue: pp.fairValue + pp.cashRealized
      }));
    },
    
    // Calculate performance metrics for a specific performance
    calculateMetricsForPerformance: (performanceId: number) => {
      const performance = portfolioPerformances.find(pp => pp.id === performanceId);
      if (!performance) return null;
      
      const totalValue = performance.fairValue + performance.cashRealized;
      const unrealizedGain = performance.fairValue - performance.totalInvestedAmount;
      const realizedGain = performance.cashRealized;
      const totalGain = totalValue - performance.totalInvestedAmount;
      const totalReturn = performance.totalInvestedAmount > 0 ? 
        (totalGain / performance.totalInvestedAmount) * 100 : 0;
      
      return {
        totalValue,
        unrealizedGain,
        realizedGain,
        totalGain,
        totalReturn,
        tvpi: performance.tvpi || 0,
        dpi: performance.dpi || 0,
        rvpi: performance.rvpi || 0,
        irr: performance.irr || 0,
        nav: performance.nav || 0,
        totalFundUnits: performance.totalFundUnits || 0,
        navPerShare: performance.navPerShare || 0
      };
    }
  };
}

export default usePortfolioPerformance;