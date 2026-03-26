'use client';

import { useRevenueMetricsContext } from '../providers/revenue-metrics-provider';
import { useRevenueMetricsStore } from '../store/revenue-metrics.store';
import { 
  type CreateRevenueMetricsInput, 
  type UpdateRevenueMetricsInput,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/revenue-metrics.schemas';

/**
 * Custom hook that combines revenue metrics context and store
 * to provide a simplified interface for revenue metrics functionality
 * 
 * @returns Revenue metrics utilities and state
 */
export function useRevenueMetrics() {
  // Get data from revenue metrics context
  const {
    revenueMetrics,
    selectedRevenueMetric,
    isLoading: contextLoading,
    error: contextError,
    fetchRevenueMetrics,
    fetchRevenueMetric,
    setSelectedRevenueMetric,
    clearError: clearContextError
  } = useRevenueMetricsContext();

  // Get additional actions from revenue metrics store
  const {
    createRevenueMetric,
    updateRevenueMetric,
    deleteRevenueMetric,
    getRevenueMetricsByCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useRevenueMetricsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addRevenueMetric = async (data: CreateRevenueMetricsInput): Promise<boolean> => {
    return await createRevenueMetric(data);
  };

  const editRevenueMetric = async (id: number, data: UpdateRevenueMetricsInput): Promise<boolean> => {
    return await updateRevenueMetric(id, data);
  };

  const removeRevenueMetric = async (id: number): Promise<boolean> => {
    return await deleteRevenueMetric(id);
  };

  return {
    // State
    revenueMetrics,
    selectedRevenueMetric,
    isLoading,
    error,
    
    // Actions
    fetchRevenueMetrics,
    fetchRevenueMetric,
    addRevenueMetric,
    editRevenueMetric,
    removeRevenueMetric,
    setSelectedRevenueMetric,
    clearError,
    
    // Helper methods
    hasRevenueMetrics: () => revenueMetrics.length > 0,
    getRevenueMetricById: (id: number) => revenueMetrics.find(rm => rm.id === id),
    
    // Filter helpers
    getRevenueMetricsByCompany: (companyId: number) => getRevenueMetricsByCompany(companyId),
    getRevenueMetricsByYear: (year: number) => 
      revenueMetrics.filter(rm => rm.year === year),
    getRevenueMetricsByScenario: (scenario: FinancialScenario) => 
      revenueMetrics.filter(rm => rm.scenario === scenario),
    getRevenueMetricsByQuarter: (quarter: Quarter) => 
      revenueMetrics.filter(rm => rm.quarter === quarter),
    getRevenueMetricsBySemester: (semester: Semester) => 
      revenueMetrics.filter(rm => rm.semester === semester),
    getRevenueMetricsByMonth: (month: Month) => 
      revenueMetrics.filter(rm => rm.month === month),
    getFullYearRevenueMetrics: () => 
      revenueMetrics.filter(rm => rm.fullYear === true),
    
    // Revenue calculation helpers
    getTotalRecurringRevenue: (companyId?: number) => {
      const filtered = companyId ? 
        revenueMetrics.filter(rm => rm.companyId === companyId && rm.recurringRevenue !== null) :
        revenueMetrics.filter(rm => rm.recurringRevenue !== null);
      
      return filtered.reduce((total, rm) => total + (rm.recurringRevenue || 0), 0);
    },
    
    getTotalNonRecurringRevenue: (companyId?: number) => {
      const filtered = companyId ? 
        revenueMetrics.filter(rm => rm.companyId === companyId && rm.nonRecurringRevenue !== null) :
        revenueMetrics.filter(rm => rm.nonRecurringRevenue !== null);
      
      return filtered.reduce((total, rm) => total + (rm.nonRecurringRevenue || 0), 0);
    },
    
    getAverageRevenueGrowthRate: (companyId?: number) => {
      const filtered = companyId ? 
        revenueMetrics.filter(rm => rm.companyId === companyId && rm.revenueGrowthRate !== null) :
        revenueMetrics.filter(rm => rm.revenueGrowthRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, rm) => total + (rm.revenueGrowthRate || 0), 0);
      return sum / filtered.length;
    },
    
    getLatestARR: (companyId: number) => {
      const companyMetrics = revenueMetrics
        .filter(rm => rm.companyId === companyId && rm.arr !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.arr || 0;
    },
    
    getLatestMRR: (companyId: number) => {
      const companyMetrics = revenueMetrics
        .filter(rm => rm.companyId === companyId && rm.mrr !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.mrr || 0;
    },
    
    getAverageCustomerMetrics: (companyId?: number) => {
      const filtered = companyId ? 
        revenueMetrics.filter(rm => rm.companyId === companyId) :
        revenueMetrics;
      
      const metricsWithARPC = filtered.filter(rm => rm.averageRevenuePerCustomer !== null);
      const metricsWithACV = filtered.filter(rm => rm.averageContractValue !== null);
      
      return {
        averageRevenuePerCustomer: metricsWithARPC.length > 0 ? 
          metricsWithARPC.reduce((sum, rm) => sum + (rm.averageRevenuePerCustomer || 0), 0) / metricsWithARPC.length : 0,
        averageContractValue: metricsWithACV.length > 0 ? 
          metricsWithACV.reduce((sum, rm) => sum + (rm.averageContractValue || 0), 0) / metricsWithACV.length : 0
      };
    },
    
    // Revenue trend analysis
    getRevenueTrend: (companyId: number) => {
      const companyMetrics = revenueMetrics
        .filter(rm => rm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[a.quarter] - qOrder[b.quarter];
          }
          return 0;
        });
      
      return companyMetrics.map(rm => ({
        year: rm.year,
        quarter: rm.quarter,
        totalRevenue: (rm.recurringRevenue || 0) + (rm.nonRecurringRevenue || 0),
        recurringRevenue: rm.recurringRevenue || 0,
        nonRecurringRevenue: rm.nonRecurringRevenue || 0,
        growthRate: rm.revenueGrowthRate || 0,
        arr: rm.arr || 0,
        mrr: rm.mrr || 0,
        date: rm.date
      }));
    },
    
    // Formatting helpers
    formatCurrency: (amount: number | null): string => {
      if (amount === null || amount === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
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
    getPeriodLabel: (revenueMetric: typeof revenueMetrics[0]): string => {
      if (revenueMetric.fullYear) return `${revenueMetric.year} (Full Year)`;
      if (revenueMetric.quarter) return `${revenueMetric.year} ${revenueMetric.quarter}`;
      if (revenueMetric.semester) return `${revenueMetric.year} ${revenueMetric.semester}`;
      if (revenueMetric.month) return `${revenueMetric.month} ${revenueMetric.year}`;
      return `${revenueMetric.year}`;
    },
    
    getLatestMetricsForCompany: (companyId: number) => {
      const companyMetrics = revenueMetrics
        .filter(rm => rm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0] || null;
    },
    
    // Business health indicators
    isGrowingRevenue: (companyId: number): boolean => {
      const latest = revenueMetrics
        .filter(rm => rm.companyId === companyId && rm.revenueGrowthRate !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.revenueGrowthRate || 0) > 0 : false;
    },
    
    hasRecurringRevenue: (companyId: number): boolean => {
      const latest = revenueMetrics
        .filter(rm => rm.companyId === companyId && rm.recurringRevenue !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.recurringRevenue || 0) > 0 : false;
    },
    
    getRecurringRevenuePercentage: (companyId: number): number => {
      const latest = revenueMetrics
        .filter(rm => rm.companyId === companyId)
        .sort((a, b) => b.year - a.year)[0];
      
      if (!latest) return 0;
      
      const totalRevenue = (latest.recurringRevenue || 0) + (latest.nonRecurringRevenue || 0);
      const recurringRevenue = latest.recurringRevenue || 0;
      
      return totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0;
    },
    
    // Summary helpers
    getRevenueSummary: (companyId?: number) => {
      const filtered = companyId ? 
        revenueMetrics.filter(rm => rm.companyId === companyId) :
        revenueMetrics;
      
      const totalRecurring = filtered.reduce((sum, rm) => sum + (rm.recurringRevenue || 0), 0);
      const totalNonRecurring = filtered.reduce((sum, rm) => sum + (rm.nonRecurringRevenue || 0), 0);
      const totalRevenue = totalRecurring + totalNonRecurring;
      
      const metricsWithGrowth = filtered.filter(rm => rm.revenueGrowthRate !== null);
      const avgGrowthRate = metricsWithGrowth.length > 0 ? 
        metricsWithGrowth.reduce((sum, rm) => sum + (rm.revenueGrowthRate || 0), 0) / metricsWithGrowth.length : 0;
      
      return {
        totalRevenue,
        totalRecurring,
        totalNonRecurring,
        recurringPercentage: totalRevenue > 0 ? (totalRecurring / totalRevenue) * 100 : 0,
        averageGrowthRate: avgGrowthRate,
        metricsCount: filtered.length,
        uniqueCompanies: [...new Set(filtered.map(rm => rm.companyId))].length
      };
    }
  };
}

export default useRevenueMetrics;