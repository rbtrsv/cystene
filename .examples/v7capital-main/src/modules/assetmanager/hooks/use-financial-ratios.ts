'use client';

import { useFinancialRatiosContext } from '../providers/financial-ratios-provider';
import { useFinancialRatiosStore } from '../store/financial-ratios.store';
import { 
  type CreateFinancialRatiosInput, 
  type UpdateFinancialRatiosInput,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/financial-ratios.schemas';

/**
 * Custom hook that combines financial ratios context and store
 * to provide a simplified interface for financial ratios functionality
 * 
 * @returns Financial ratios utilities and state
 */
export function useFinancialRatios() {
  // Get data from financial ratios context
  const {
    financialRatios,
    selectedFinancialRatio,
    isLoading: contextLoading,
    error: contextError,
    fetchFinancialRatios,
    fetchFinancialRatio,
    setSelectedFinancialRatio,
    clearError: clearContextError
  } = useFinancialRatiosContext();

  // Get additional actions from financial ratios store
  const {
    createFinancialRatio,
    updateFinancialRatio,
    deleteFinancialRatio,
    getFinancialRatiosByCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useFinancialRatiosStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addFinancialRatio = async (data: CreateFinancialRatiosInput): Promise<boolean> => {
    return await createFinancialRatio(data);
  };

  const editFinancialRatio = async (id: number, data: UpdateFinancialRatiosInput): Promise<boolean> => {
    return await updateFinancialRatio(id, data);
  };

  const removeFinancialRatio = async (id: number): Promise<boolean> => {
    return await deleteFinancialRatio(id);
  };

  return {
    // State
    financialRatios,
    selectedFinancialRatio,
    isLoading,
    error,
    
    // Actions
    fetchFinancialRatios,
    fetchFinancialRatio,
    addFinancialRatio,
    editFinancialRatio,
    removeFinancialRatio,
    setSelectedFinancialRatio,
    clearError,
    
    // Helper methods
    hasFinancialRatios: () => financialRatios.length > 0,
    getFinancialRatioById: (id: number) => financialRatios.find(fr => fr.id === id),
    
    // Filter helpers
    getFinancialRatiosByCompany: (companyId: number) => getFinancialRatiosByCompany(companyId),
    getFinancialRatiosByYear: (year: number) => 
      financialRatios.filter(fr => fr.year === year),
    getFinancialRatiosByScenario: (scenario: FinancialScenario) => 
      financialRatios.filter(fr => fr.scenario === scenario),
    getFinancialRatiosByQuarter: (quarter: Quarter) => 
      financialRatios.filter(fr => fr.quarter === quarter),
    getFinancialRatiosBySemester: (semester: Semester) => 
      financialRatios.filter(fr => fr.semester === semester),
    getFinancialRatiosByMonth: (month: Month) => 
      financialRatios.filter(fr => fr.month === month),
    getFullYearFinancialRatios: () => 
      financialRatios.filter(fr => fr.fullYear === true),
    
    // Calculation helpers
    getAverageCurrentRatio: (companyId?: number) => {
      const filtered = companyId ? 
        financialRatios.filter(fr => fr.companyId === companyId && fr.currentRatio !== null) :
        financialRatios.filter(fr => fr.currentRatio !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, fr) => total + (fr.currentRatio || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageDebtToEquityRatio: (companyId?: number) => {
      const filtered = companyId ? 
        financialRatios.filter(fr => fr.companyId === companyId && fr.debtToEquityRatio !== null) :
        financialRatios.filter(fr => fr.debtToEquityRatio !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, fr) => total + (fr.debtToEquityRatio || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageNetProfitMargin: (companyId?: number) => {
      const filtered = companyId ? 
        financialRatios.filter(fr => fr.companyId === companyId && fr.netProfitMargin !== null) :
        financialRatios.filter(fr => fr.netProfitMargin !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, fr) => total + (fr.netProfitMargin || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageReturnOnEquity: (companyId?: number) => {
      const filtered = companyId ? 
        financialRatios.filter(fr => fr.companyId === companyId && fr.returnOnEquity !== null) :
        financialRatios.filter(fr => fr.returnOnEquity !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, fr) => total + (fr.returnOnEquity || 0), 0);
      return sum / filtered.length;
    },
    
    // Trend analysis helpers
    getRatioTrend: (companyId: number, ratioField: keyof typeof financialRatios[0]) => {
      const companyRatios = financialRatios
        .filter(fr => fr.companyId === companyId && fr[ratioField] !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[a.quarter] - qOrder[b.quarter];
          }
          return 0;
        });
      
      return companyRatios.map(fr => ({
        year: fr.year,
        quarter: fr.quarter,
        value: fr[ratioField] as number,
        date: fr.date
      }));
    },
    
    // Formatting helpers
    formatRatio: (ratio: number | null): string => {
      if (ratio === null || ratio === undefined) return 'N/A';
      return ratio.toFixed(2);
    },
    
    formatPercentage: (percentage: number | null): string => {
      if (percentage === null || percentage === undefined) return 'N/A';
      return `${percentage.toFixed(1)}%`;
    },
    
    formatDate: (date: Date | string | null): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    // Business logic helpers
    getPeriodLabel: (financialRatio: typeof financialRatios[0]): string => {
      if (financialRatio.fullYear) return `${financialRatio.year} (Full Year)`;
      if (financialRatio.quarter) return `${financialRatio.year} ${financialRatio.quarter}`;
      if (financialRatio.semester) return `${financialRatio.year} ${financialRatio.semester}`;
      if (financialRatio.month) return `${financialRatio.month} ${financialRatio.year}`;
      return `${financialRatio.year}`;
    },
    
    getLatestRatiosForCompany: (companyId: number) => {
      const companyRatios = financialRatios
        .filter(fr => fr.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyRatios[0] || null;
    },
    
    // Ratio analysis helpers
    isHealthyCurrentRatio: (currentRatio: number | null): boolean => {
      if (currentRatio === null) return false;
      return currentRatio >= 1.0 && currentRatio <= 3.0;
    },
    
    isHealthyDebtToEquityRatio: (debtToEquityRatio: number | null): boolean => {
      if (debtToEquityRatio === null) return false;
      return debtToEquityRatio <= 2.0;
    },
    
    isProfitable: (netProfitMargin: number | null): boolean => {
      if (netProfitMargin === null) return false;
      return netProfitMargin > 0;
    },
    
    // Summary helpers
    getRatioSummary: (companyId?: number) => {
      const filtered = companyId ? 
        financialRatios.filter(fr => fr.companyId === companyId) :
        financialRatios;
      
      const ratiosWithCurrentRatio = filtered.filter(fr => fr.currentRatio !== null);
      const ratiosWithProfitMargin = filtered.filter(fr => fr.netProfitMargin !== null);
      const ratiosWithROE = filtered.filter(fr => fr.returnOnEquity !== null);
      
      return {
        totalRatios: filtered.length,
        avgCurrentRatio: ratiosWithCurrentRatio.length > 0 ? 
          ratiosWithCurrentRatio.reduce((sum, fr) => sum + (fr.currentRatio || 0), 0) / ratiosWithCurrentRatio.length : 0,
        avgNetProfitMargin: ratiosWithProfitMargin.length > 0 ? 
          ratiosWithProfitMargin.reduce((sum, fr) => sum + (fr.netProfitMargin || 0), 0) / ratiosWithProfitMargin.length : 0,
        avgReturnOnEquity: ratiosWithROE.length > 0 ? 
          ratiosWithROE.reduce((sum, fr) => sum + (fr.returnOnEquity || 0), 0) / ratiosWithROE.length : 0,
        uniqueCompanies: [...new Set(filtered.map(fr => fr.companyId))].length
      };
    }
  };
}

export default useFinancialRatios;