'use client';

import { useOperationalMetricsContext } from '../providers/operational-metrics-provider';
import { useOperationalMetricsStore } from '../store/operational-metrics.store';
import { 
  type CreateOperationalMetricsInput, 
  type UpdateOperationalMetricsInput,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/operational-metrics.schemas';

/**
 * Custom hook that combines operational metrics context and store
 * to provide a simplified interface for operational metrics functionality
 * 
 * @returns Operational metrics utilities and state
 */
export function useOperationalMetrics() {
  // Get data from operational metrics context
  const {
    operationalMetrics,
    selectedOperationalMetric,
    isLoading: contextLoading,
    error: contextError,
    fetchOperationalMetrics,
    fetchOperationalMetric,
    setSelectedOperationalMetric,
    clearError: clearContextError
  } = useOperationalMetricsContext();

  // Get additional actions from operational metrics store
  const {
    createOperationalMetric,
    updateOperationalMetric,
    deleteOperationalMetric,
    getOperationalMetricsByCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useOperationalMetricsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addOperationalMetric = async (data: CreateOperationalMetricsInput): Promise<boolean> => {
    return await createOperationalMetric(data);
  };

  const editOperationalMetric = async (id: number, data: UpdateOperationalMetricsInput): Promise<boolean> => {
    return await updateOperationalMetric(id, data);
  };

  const removeOperationalMetric = async (id: number): Promise<boolean> => {
    return await deleteOperationalMetric(id);
  };

  return {
    // State
    operationalMetrics,
    selectedOperationalMetric,
    isLoading,
    error,
    
    // Actions
    fetchOperationalMetrics,
    fetchOperationalMetric,
    addOperationalMetric,
    editOperationalMetric,
    removeOperationalMetric,
    setSelectedOperationalMetric,
    clearError,
    
    // Helper methods
    hasOperationalMetrics: () => operationalMetrics.length > 0,
    getOperationalMetricById: (id: number) => operationalMetrics.find(om => om.id === id),
    
    // Filter helpers
    getOperationalMetricsByCompany: (companyId: number) => getOperationalMetricsByCompany(companyId),
    getOperationalMetricsByYear: (year: number) => 
      operationalMetrics.filter(om => om.year === year),
    getOperationalMetricsByScenario: (scenario: FinancialScenario) => 
      operationalMetrics.filter(om => om.scenario === scenario),
    getOperationalMetricsByQuarter: (quarter: Quarter) => 
      operationalMetrics.filter(om => om.quarter === quarter),
    getOperationalMetricsBySemester: (semester: Semester) => 
      operationalMetrics.filter(om => om.semester === semester),
    getOperationalMetricsByMonth: (month: Month) => 
      operationalMetrics.filter(om => om.month === month),
    getFullYearOperationalMetrics: () => 
      operationalMetrics.filter(om => om.fullYear === true),
    
    // Operational calculation helpers
    getAverageBurnRate: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId && om.burnRate !== null) :
        operationalMetrics.filter(om => om.burnRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, om) => total + (om.burnRate || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageGrossMargin: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId && om.grossMargin !== null) :
        operationalMetrics.filter(om => om.grossMargin !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, om) => total + (om.grossMargin || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageRuleOf40: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId && om.ruleOf40 !== null) :
        operationalMetrics.filter(om => om.ruleOf40 !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, om) => total + (om.ruleOf40 || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageRevenuePerEmployee: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId && om.revenuePerEmployee !== null) :
        operationalMetrics.filter(om => om.revenuePerEmployee !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, om) => total + (om.revenuePerEmployee || 0), 0);
      return sum / filtered.length;
    },
    
    getLatestRunwayMonths: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.runwayMonths !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.runwayMonths || 0;
    },
    
    getLatestBurnRate: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.burnRate !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.burnRate || 0;
    },
    
    getLatestRuleOf40: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.ruleOf40 !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.ruleOf40 || 0;
    },
    
    getLatestBurnMultiple: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.burnMultiple !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.burnMultiple || 0;
    },
    
    getLatestRevenuePerEmployee: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.revenuePerEmployee !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.revenuePerEmployee || 0;
    },
    
    getLatestCapitalEfficiency: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId && om.capitalEfficiency !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.capitalEfficiency || 0;
    },
    
    // Operational trend analysis
    getOperationalTrend: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[a.quarter] - qOrder[b.quarter];
          }
          return 0;
        });
      
      return companyMetrics.map(om => ({
        year: om.year,
        quarter: om.quarter,
        burnRate: om.burnRate || 0,
        runwayMonths: om.runwayMonths || 0,
        ruleOf40: om.ruleOf40 || 0,
        burnMultiple: om.burnMultiple || 0,
        grossMargin: om.grossMargin || 0,
        contributionMargin: om.contributionMargin || 0,
        revenuePerEmployee: om.revenuePerEmployee || 0,
        profitPerEmployee: om.profitPerEmployee || 0,
        capitalEfficiency: om.capitalEfficiency || 0,
        ebitda: om.ebitda || 0,
        date: om.date
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
    
    formatMonths: (months: number | null): string => {
      if (months === null || months === undefined) return 'N/A';
      const monthsInt = Math.floor(months);
      return `${monthsInt} month${monthsInt !== 1 ? 's' : ''}`;
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
    getPeriodLabel: (operationalMetric: typeof operationalMetrics[0]): string => {
      if (operationalMetric.fullYear) return `${operationalMetric.year} (Full Year)`;
      if (operationalMetric.quarter) return `${operationalMetric.year} ${operationalMetric.quarter}`;
      if (operationalMetric.semester) return `${operationalMetric.year} ${operationalMetric.semester}`;
      if (operationalMetric.month) return `${operationalMetric.month} ${operationalMetric.year}`;
      return `${operationalMetric.year}`;
    },
    
    getLatestMetricsForCompany: (companyId: number) => {
      const companyMetrics = operationalMetrics
        .filter(om => om.companyId === companyId)
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
    hasHealthyRunway: (companyId: number, minMonths: number = 12): boolean => {
      const latest = operationalMetrics
        .filter(om => om.companyId === companyId && om.runwayMonths !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.runwayMonths || 0) >= minMonths : false;
    },
    
    hasHealthyRuleOf40: (companyId: number, threshold: number = 40): boolean => {
      const latest = operationalMetrics
        .filter(om => om.companyId === companyId && om.ruleOf40 !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.ruleOf40 || 0) >= threshold : false;
    },
    
    hasHealthyGrossMargin: (companyId: number, threshold: number = 70): boolean => {
      const latest = operationalMetrics
        .filter(om => om.companyId === companyId && om.grossMargin !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.grossMargin || 0) >= threshold : false;
    },
    
    isCapitalEfficient: (companyId: number, threshold: number = 1): boolean => {
      const latest = operationalMetrics
        .filter(om => om.companyId === companyId && om.capitalEfficiency !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.capitalEfficiency || 0) >= threshold : false;
    },
    
    isBurnEfficient: (companyId: number, threshold: number = 2): boolean => {
      const latest = operationalMetrics
        .filter(om => om.companyId === companyId && om.burnMultiple !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.burnMultiple || 0) <= threshold : false;
    },
    
    // Summary helpers
    getOperationalSummary: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId) :
        operationalMetrics;
      
      const metricsWithBurn = filtered.filter(om => om.burnRate !== null);
      const metricsWithMargin = filtered.filter(om => om.grossMargin !== null);
      const metricsWithRule40 = filtered.filter(om => om.ruleOf40 !== null);
      
      const avgBurnRate = metricsWithBurn.length > 0 ? 
        metricsWithBurn.reduce((sum, om) => sum + (om.burnRate || 0), 0) / metricsWithBurn.length : 0;
      
      const avgGrossMargin = metricsWithMargin.length > 0 ? 
        metricsWithMargin.reduce((sum, om) => sum + (om.grossMargin || 0), 0) / metricsWithMargin.length : 0;
      
      const avgRuleOf40 = metricsWithRule40.length > 0 ? 
        metricsWithRule40.reduce((sum, om) => sum + (om.ruleOf40 || 0), 0) / metricsWithRule40.length : 0;
      
      return {
        averageBurnRate: avgBurnRate,
        averageGrossMargin: avgGrossMargin,
        averageRuleOf40: avgRuleOf40,
        isHealthyMargin: avgGrossMargin >= 70,
        isHealthyRule40: avgRuleOf40 >= 40,
        metricsCount: filtered.length,
        uniqueCompanies: [...new Set(filtered.map(om => om.companyId))].length
      };
    },
    
    getEfficiencySummary: (companyId?: number) => {
      const filtered = companyId ? 
        operationalMetrics.filter(om => om.companyId === companyId) :
        operationalMetrics;
      
      const metricsWithRevPerEmp = filtered.filter(om => om.revenuePerEmployee !== null);
      const metricsWithCapEff = filtered.filter(om => om.capitalEfficiency !== null);
      const metricsWithBurnMult = filtered.filter(om => om.burnMultiple !== null);
      
      const avgRevenuePerEmployee = metricsWithRevPerEmp.length > 0 ? 
        metricsWithRevPerEmp.reduce((sum, om) => sum + (om.revenuePerEmployee || 0), 0) / metricsWithRevPerEmp.length : 0;
      
      const avgCapitalEfficiency = metricsWithCapEff.length > 0 ? 
        metricsWithCapEff.reduce((sum, om) => sum + (om.capitalEfficiency || 0), 0) / metricsWithCapEff.length : 0;
      
      const avgBurnMultiple = metricsWithBurnMult.length > 0 ? 
        metricsWithBurnMult.reduce((sum, om) => sum + (om.burnMultiple || 0), 0) / metricsWithBurnMult.length : 0;
      
      return {
        averageRevenuePerEmployee: avgRevenuePerEmployee,
        averageCapitalEfficiency: avgCapitalEfficiency,
        averageBurnMultiple: avgBurnMultiple,
        isCapitalEfficient: avgCapitalEfficiency >= 1,
        isBurnEfficient: avgBurnMultiple <= 2,
        metricsCount: filtered.length
      };
    }
  };
}

export default useOperationalMetrics;