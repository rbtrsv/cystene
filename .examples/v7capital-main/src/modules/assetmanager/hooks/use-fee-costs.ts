'use client';

import { useFeeCostsContext } from '../providers/fee-costs-provider';
import { useFeeCostsStore } from '../store/fee-costs.store';
import { 
  type CreateFeeCostInput, 
  type UpdateFeeCostInput,
  type FeeCostType,
  type Frequency
} from '../schemas/fee-costs.schemas';

/**
 * Custom hook that combines fee costs context and store
 * to provide a simplified interface for fee costs functionality
 * 
 * @returns Fee costs utilities and state
 */
export function useFeeCosts() {
  // Get data from fee costs context
  const {
    feeCosts,
    selectedFeeCost,
    isLoading: contextLoading,
    error: contextError,
    fetchFeeCosts,
    fetchFeeCost,
    setSelectedFeeCost,
    clearError: clearContextError
  } = useFeeCostsContext();

  // Get additional actions from fee costs store
  const {
    createFeeCost,
    updateFeeCost,
    deleteFeeCost,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFeeCostsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addFeeCost = async (data: CreateFeeCostInput): Promise<boolean> => {
    return await createFeeCost(data);
  };

  const editFeeCost = async (id: number, data: UpdateFeeCostInput): Promise<boolean> => {
    return await updateFeeCost(id, data);
  };

  const removeFeeCost = async (id: number): Promise<boolean> => {
    return await deleteFeeCost(id);
  };

  return {
    // State
    feeCosts,
    selectedFeeCost,
    isLoading,
    error,
    
    // Actions
    fetchFeeCosts,
    fetchFeeCost,
    addFeeCost,
    editFeeCost,
    removeFeeCost,
    setSelectedFeeCost,
    clearError,
    
    // Helper methods
    hasFeeCosts: () => feeCosts.length > 0,
    getFeeCostById: (id: number) => feeCosts.find(fc => fc.id === id),
    getFeeCostName: (id: number) => {
      const feeCost = feeCosts.find(fc => fc.id === id);
      return feeCost ? (feeCost.feeCostName || `${feeCost.feeCostType} Fee`) : 'Unknown Fee Cost';
    },
    
    // Filter helpers
    getFeeCostsByFund: (fundId: number) => 
      feeCosts.filter(fc => fc.fundId === fundId),
    
    getFeeCostsByRound: (roundId: number) => 
      feeCosts.filter(fc => fc.roundId === roundId),
    
    getFeeCostsByType: (type: FeeCostType) => 
      feeCosts.filter(fc => fc.feeCostType === type),
    
    getFeeCostsByFrequency: (frequency: Frequency) => 
      feeCosts.filter(fc => fc.frequency === frequency),
    
    getFeeCostsByDateRange: (startDate: string, endDate: string) => 
      feeCosts.filter(fc => {
        const feeDate = new Date(fc.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return feeDate >= start && feeDate <= end;
      }),
    
    getRecurringFeeCosts: () => 
      feeCosts.filter(fc => fc.frequency !== 'ONE_TIME'),
    
    getOneTimeFeeCosts: () => 
      feeCosts.filter(fc => fc.frequency === 'ONE_TIME'),
    
    // Calculation helpers
    getTotalFeeCosts: () => {
      return feeCosts.reduce((total, fc) => {
        return total + fc.amount;
      }, 0);
    },
    
    getTotalFeeCostsByFund: (fundId: number) => {
      return feeCosts
        .filter(fc => fc.fundId === fundId)
        .reduce((total, fc) => total + fc.amount, 0);
    },
    
    getTotalFeeCostsByType: (type: FeeCostType) => {
      return feeCosts
        .filter(fc => fc.feeCostType === type)
        .reduce((total, fc) => total + fc.amount, 0);
    },
    
    getAnnualizedFeeCosts: () => {
      return feeCosts.reduce((total, fc) => {
        const multiplier = {
          'ONE_TIME': 0, // Don't annualize one-time costs
          'MONTHLY': 12,
          'QUARTERLY': 4,
          'ANNUAL': 1
        }[fc.frequency];
        
        return total + (fc.amount * multiplier);
      }, 0);
    },
    
    getFeeCostBreakdown: () => {
      const breakdown: Record<FeeCostType, number> = {
        'MANAGEMENT': 0,
        'PERFORMANCE': 0,
        'SETUP': 0,
        'ADMINISTRATIVE': 0,
        'LEGAL': 0,
        'AUDIT': 0,
        'CUSTODIAN': 0,
        'OTHER': 0
      };
      
      feeCosts.forEach(fc => {
        breakdown[fc.feeCostType] += fc.amount;
      });
      
      return breakdown;
    },
    
    // Formatting helpers
    formatCurrency: (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
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
    
    // Label helpers
    getFeeCostTypeLabel: (type: FeeCostType): string => {
      const typeLabels: Record<FeeCostType, string> = {
        'MANAGEMENT': 'Management Fee',
        'PERFORMANCE': 'Performance Fee',
        'SETUP': 'Setup Fee',
        'ADMINISTRATIVE': 'Administrative Fee',
        'LEGAL': 'Legal Fee',
        'AUDIT': 'Audit Fee',
        'CUSTODIAN': 'Custodian Fee',
        'OTHER': 'Other Fee'
      };
      
      return typeLabels[type] || type;
    },
    
    getFrequencyLabel: (frequency: Frequency): string => {
      const frequencyLabels: Record<Frequency, string> = {
        'ONE_TIME': 'One-time',
        'MONTHLY': 'Monthly',
        'QUARTERLY': 'Quarterly',
        'ANNUAL': 'Annual'
      };
      
      return frequencyLabels[frequency] || frequency;
    },
    
    // Business logic helpers
    isRecurringFeeCost: (feeCostId: number): boolean => {
      const feeCost = feeCosts.find(fc => fc.id === feeCostId);
      return feeCost ? feeCost.frequency !== 'ONE_TIME' : false;
    },
    
    getNextPaymentDate: (feeCostId: number): Date | null => {
      const feeCost = feeCosts.find(fc => fc.id === feeCostId);
      if (!feeCost || feeCost.frequency === 'ONE_TIME') return null;
      
      const lastDate = new Date(feeCost.date);
      const nextDate = new Date(lastDate);
      
      switch (feeCost.frequency) {
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'QUARTERLY':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'ANNUAL':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      
      return nextDate;
    },
    
    getFeeCostsByTransaction: (transactionRef: string) => 
      feeCosts.filter(fc => fc.transactionReference === transactionRef),
    
    // Analysis helpers
    getFeeCostMetrics: () => {
      const totalAmount = feeCosts.reduce((sum, fc) => sum + fc.amount, 0);
      const averageAmount = feeCosts.length > 0 ? totalAmount / feeCosts.length : 0;
      const recurringCosts = feeCosts.filter(fc => fc.frequency !== 'ONE_TIME');
      const oneTimeCosts = feeCosts.filter(fc => fc.frequency === 'ONE_TIME');
      
      return {
        totalAmount,
        averageAmount,
        totalCount: feeCosts.length,
        recurringCount: recurringCosts.length,
        oneTimeCount: oneTimeCosts.length,
        recurringTotal: recurringCosts.reduce((sum, fc) => sum + fc.amount, 0),
        oneTimeTotal: oneTimeCosts.reduce((sum, fc) => sum + fc.amount, 0)
      };
    },
    
    // Cost percentage of total
    getFeeCostPercentage: (feeCostId: number): number => {
      const feeCost = feeCosts.find(fc => fc.id === feeCostId);
      if (!feeCost) return 0;
      
      const total = feeCosts.reduce((sum, fc) => sum + fc.amount, 0);
      return total > 0 ? (feeCost.amount / total) * 100 : 0;
    }
  };
}

export default useFeeCosts;