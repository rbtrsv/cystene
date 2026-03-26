'use client';

import { useCustomerMetricsContext } from '../providers/customer-metrics-provider';
import { useCustomerMetricsStore } from '../store/customer-metrics.store';
import { 
  type CreateCustomerMetricsInput, 
  type UpdateCustomerMetricsInput,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/customer-metrics.schemas';

/**
 * Custom hook that combines customer metrics context and store
 * to provide a simplified interface for customer metrics functionality
 * 
 * @returns Customer metrics utilities and state
 */
export function useCustomerMetrics() {
  // Get data from customer metrics context
  const {
    customerMetrics,
    selectedCustomerMetric,
    isLoading: contextLoading,
    error: contextError,
    fetchCustomerMetrics,
    fetchCustomerMetric,
    setSelectedCustomerMetric,
    clearError: clearContextError
  } = useCustomerMetricsContext();

  // Get additional actions from customer metrics store
  const {
    createCustomerMetric,
    updateCustomerMetric,
    deleteCustomerMetric,
    getCustomerMetricsByCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useCustomerMetricsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addCustomerMetric = async (data: CreateCustomerMetricsInput): Promise<boolean> => {
    return await createCustomerMetric(data);
  };

  const editCustomerMetric = async (id: number, data: UpdateCustomerMetricsInput): Promise<boolean> => {
    return await updateCustomerMetric(id, data);
  };

  const removeCustomerMetric = async (id: number): Promise<boolean> => {
    return await deleteCustomerMetric(id);
  };

  return {
    // State
    customerMetrics,
    selectedCustomerMetric,
    isLoading,
    error,
    
    // Actions
    fetchCustomerMetrics,
    fetchCustomerMetric,
    addCustomerMetric,
    editCustomerMetric,
    removeCustomerMetric,
    setSelectedCustomerMetric,
    clearError,
    
    // Helper methods
    hasCustomerMetrics: () => customerMetrics.length > 0,
    getCustomerMetricById: (id: number) => customerMetrics.find(cm => cm.id === id),
    
    // Filter helpers
    getCustomerMetricsByCompany: (companyId: number) => getCustomerMetricsByCompany(companyId),
    getCustomerMetricsByYear: (year: number) => 
      customerMetrics.filter(cm => cm.year === year),
    getCustomerMetricsByScenario: (scenario: FinancialScenario) => 
      customerMetrics.filter(cm => cm.scenario === scenario),
    getCustomerMetricsByQuarter: (quarter: Quarter) => 
      customerMetrics.filter(cm => cm.quarter === quarter),
    getCustomerMetricsBySemester: (semester: Semester) => 
      customerMetrics.filter(cm => cm.semester === semester),
    getCustomerMetricsByMonth: (month: Month) => 
      customerMetrics.filter(cm => cm.month === month),
    getFullYearCustomerMetrics: () => 
      customerMetrics.filter(cm => cm.fullYear === true),
    
    // Customer calculation helpers
    getTotalCustomers: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.totalCustomers !== null) :
        customerMetrics.filter(cm => cm.totalCustomers !== null);
      
      return filtered.reduce((total, cm) => total + (cm.totalCustomers || 0), 0);
    },
    
    getTotalNewCustomers: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.newCustomers !== null) :
        customerMetrics.filter(cm => cm.newCustomers !== null);
      
      return filtered.reduce((total, cm) => total + (cm.newCustomers || 0), 0);
    },
    
    getTotalChurnedCustomers: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.churnedCustomers !== null) :
        customerMetrics.filter(cm => cm.churnedCustomers !== null);
      
      return filtered.reduce((total, cm) => total + (cm.churnedCustomers || 0), 0);
    },
    
    getAverageChurnRate: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.customerChurnRate !== null) :
        customerMetrics.filter(cm => cm.customerChurnRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.customerChurnRate || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageCustomerGrowthRate: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.customerGrowthRate !== null) :
        customerMetrics.filter(cm => cm.customerGrowthRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.customerGrowthRate || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageCAC: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.cac !== null) :
        customerMetrics.filter(cm => cm.cac !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.cac || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageLTV: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.ltv !== null) :
        customerMetrics.filter(cm => cm.ltv !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.ltv || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageLTVCACRatio: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.ltvCacRatio !== null) :
        customerMetrics.filter(cm => cm.ltvCacRatio !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.ltvCacRatio || 0), 0);
      return sum / filtered.length;
    },
    
    getLatestCAC: (companyId: number) => {
      const companyMetrics = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.cac !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.cac || 0;
    },
    
    getLatestLTV: (companyId: number) => {
      const companyMetrics = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.ltv !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.ltv || 0;
    },
    
    getLatestLTVCACRatio: (companyId: number) => {
      const companyMetrics = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.ltvCacRatio !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.ltvCacRatio || 0;
    },
    
    // User metrics helpers
    getTotalActiveUsers: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.activeUsers !== null) :
        customerMetrics.filter(cm => cm.activeUsers !== null);
      
      return filtered.reduce((total, cm) => total + (cm.activeUsers || 0), 0);
    },
    
    getAverageUserGrowthRate: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId && cm.userGrowthRate !== null) :
        customerMetrics.filter(cm => cm.userGrowthRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, cm) => total + (cm.userGrowthRate || 0), 0);
      return sum / filtered.length;
    },
    
    // Customer trend analysis
    getCustomerTrend: (companyId: number) => {
      const companyMetrics = customerMetrics
        .filter(cm => cm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[a.quarter] - qOrder[b.quarter];
          }
          return 0;
        });
      
      return companyMetrics.map(cm => ({
        year: cm.year,
        quarter: cm.quarter,
        totalCustomers: cm.totalCustomers || 0,
        newCustomers: cm.newCustomers || 0,
        churnedCustomers: cm.churnedCustomers || 0,
        activeUsers: cm.activeUsers || 0,
        churnRate: cm.customerChurnRate || 0,
        growthRate: cm.customerGrowthRate || 0,
        cac: cm.cac || 0,
        ltv: cm.ltv || 0,
        ltvCacRatio: cm.ltvCacRatio || 0,
        date: cm.date
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
    
    formatRatio: (ratio: number | null): string => {
      if (ratio === null || ratio === undefined) return 'N/A';
      return ratio.toFixed(2);
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
    getPeriodLabel: (customerMetric: typeof customerMetrics[0]): string => {
      if (customerMetric.fullYear) return `${customerMetric.year} (Full Year)`;
      if (customerMetric.quarter) return `${customerMetric.year} ${customerMetric.quarter}`;
      if (customerMetric.semester) return `${customerMetric.year} ${customerMetric.semester}`;
      if (customerMetric.month) return `${customerMetric.month} ${customerMetric.year}`;
      return `${customerMetric.year}`;
    },
    
    getLatestMetricsForCompany: (companyId: number) => {
      const companyMetrics = customerMetrics
        .filter(cm => cm.companyId === companyId)
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
    isGrowingCustomerBase: (companyId: number): boolean => {
      const latest = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.customerGrowthRate !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.customerGrowthRate || 0) > 0 : false;
    },
    
    hasHealthyChurnRate: (companyId: number, threshold: number = 5): boolean => {
      const latest = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.customerChurnRate !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.customerChurnRate || 0) <= threshold : false;
    },
    
    hasHealthyLTVCACRatio: (companyId: number, threshold: number = 3): boolean => {
      const latest = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.ltvCacRatio !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.ltvCacRatio || 0) >= threshold : false;
    },
    
    isAcquiringEfficiently: (companyId: number): boolean => {
      const latest = customerMetrics
        .filter(cm => cm.companyId === companyId && cm.customerAcquisitionEfficiency !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.customerAcquisitionEfficiency || 0) > 1 : false;
    },
    
    // Summary helpers
    getCustomerSummary: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId) :
        customerMetrics;
      
      const totalCustomersSum = filtered.reduce((sum, cm) => sum + (cm.totalCustomers || 0), 0);
      const totalNewCustomers = filtered.reduce((sum, cm) => sum + (cm.newCustomers || 0), 0);
      const totalChurnedCustomers = filtered.reduce((sum, cm) => sum + (cm.churnedCustomers || 0), 0);
      
      const metricsWithChurn = filtered.filter(cm => cm.customerChurnRate !== null);
      const avgChurnRate = metricsWithChurn.length > 0 ? 
        metricsWithChurn.reduce((sum, cm) => sum + (cm.customerChurnRate || 0), 0) / metricsWithChurn.length : 0;
      
      const metricsWithGrowth = filtered.filter(cm => cm.customerGrowthRate !== null);
      const avgGrowthRate = metricsWithGrowth.length > 0 ? 
        metricsWithGrowth.reduce((sum, cm) => sum + (cm.customerGrowthRate || 0), 0) / metricsWithGrowth.length : 0;
      
      return {
        totalCustomers: totalCustomersSum,
        totalNewCustomers,
        totalChurnedCustomers,
        netCustomerGrowth: totalNewCustomers - totalChurnedCustomers,
        averageChurnRate: avgChurnRate,
        averageGrowthRate: avgGrowthRate,
        metricsCount: filtered.length,
        uniqueCompanies: [...new Set(filtered.map(cm => cm.companyId))].length
      };
    },
    
    getAcquisitionSummary: (companyId?: number) => {
      const filtered = companyId ? 
        customerMetrics.filter(cm => cm.companyId === companyId) :
        customerMetrics;
      
      const metricsWithCAC = filtered.filter(cm => cm.cac !== null);
      const metricsWithLTV = filtered.filter(cm => cm.ltv !== null);
      const metricsWithRatio = filtered.filter(cm => cm.ltvCacRatio !== null);
      
      const avgCAC = metricsWithCAC.length > 0 ? 
        metricsWithCAC.reduce((sum, cm) => sum + (cm.cac || 0), 0) / metricsWithCAC.length : 0;
      
      const avgLTV = metricsWithLTV.length > 0 ? 
        metricsWithLTV.reduce((sum, cm) => sum + (cm.ltv || 0), 0) / metricsWithLTV.length : 0;
      
      const avgLTVCACRatio = metricsWithRatio.length > 0 ? 
        metricsWithRatio.reduce((sum, cm) => sum + (cm.ltvCacRatio || 0), 0) / metricsWithRatio.length : 0;
      
      return {
        averageCAC: avgCAC,
        averageLTV: avgLTV,
        averageLTVCACRatio: avgLTVCACRatio,
        isHealthyRatio: avgLTVCACRatio >= 3,
        metricsCount: filtered.length
      };
    }
  };
}

export default useCustomerMetrics;