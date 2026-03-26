'use client';

import { useTeamMetricsContext } from '../providers/team-metrics-provider';
import { useTeamMetricsStore } from '../store/team-metrics.store';
import { 
  type CreateTeamMetricsInput, 
  type UpdateTeamMetricsInput,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/team-metrics.schemas';

/**
 * Custom hook that combines team metrics context and store
 * to provide a simplified interface for team metrics functionality
 * 
 * @returns Team metrics utilities and state
 */
export function useTeamMetrics() {
  // Get data from team metrics context
  const {
    teamMetrics,
    selectedTeamMetric,
    isLoading: contextLoading,
    error: contextError,
    fetchTeamMetrics,
    fetchTeamMetric,
    setSelectedTeamMetric,
    clearError: clearContextError
  } = useTeamMetricsContext();

  // Get additional actions from team metrics store
  const {
    createTeamMetric,
    updateTeamMetric,
    deleteTeamMetric,
    getTeamMetricsByCompany,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useTeamMetricsStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addTeamMetric = async (data: CreateTeamMetricsInput): Promise<boolean> => {
    return await createTeamMetric(data);
  };

  const editTeamMetric = async (id: number, data: UpdateTeamMetricsInput): Promise<boolean> => {
    return await updateTeamMetric(id, data);
  };

  const removeTeamMetric = async (id: number): Promise<boolean> => {
    return await deleteTeamMetric(id);
  };

  return {
    // State
    teamMetrics,
    selectedTeamMetric,
    isLoading,
    error,
    
    // Actions
    fetchTeamMetrics,
    fetchTeamMetric,
    addTeamMetric,
    editTeamMetric,
    removeTeamMetric,
    setSelectedTeamMetric,
    clearError,
    
    // Helper methods
    hasTeamMetrics: () => teamMetrics.length > 0,
    getTeamMetricById: (id: number) => teamMetrics.find(tm => tm.id === id),
    
    // Filter helpers
    getTeamMetricsByCompany: (companyId: number) => getTeamMetricsByCompany(companyId),
    getTeamMetricsByYear: (year: number) => 
      teamMetrics.filter(tm => tm.year === year),
    getTeamMetricsByScenario: (scenario: FinancialScenario) => 
      teamMetrics.filter(tm => tm.scenario === scenario),
    getTeamMetricsByQuarter: (quarter: Quarter) => 
      teamMetrics.filter(tm => tm.quarter === quarter),
    getTeamMetricsBySemester: (semester: Semester) => 
      teamMetrics.filter(tm => tm.semester === semester),
    getTeamMetricsByMonth: (month: Month) => 
      teamMetrics.filter(tm => tm.month === month),
    getFullYearTeamMetrics: () => 
      teamMetrics.filter(tm => tm.fullYear === true),
    
    // Team size calculation helpers
    getTotalEmployees: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.totalEmployees !== null) :
        teamMetrics.filter(tm => tm.totalEmployees !== null);
      
      return filtered.reduce((total, tm) => total + (tm.totalEmployees || 0), 0);
    },
    
    getTotalFullTimeEmployees: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.fullTimeEmployees !== null) :
        teamMetrics.filter(tm => tm.fullTimeEmployees !== null);
      
      return filtered.reduce((total, tm) => total + (tm.fullTimeEmployees || 0), 0);
    },
    
    getTotalContractors: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.contractors !== null) :
        teamMetrics.filter(tm => tm.contractors !== null);
      
      return filtered.reduce((total, tm) => total + (tm.contractors || 0), 0);
    },
    
    getAverageEmployeeGrowthRate: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.employeeGrowthRate !== null) :
        teamMetrics.filter(tm => tm.employeeGrowthRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, tm) => total + (tm.employeeGrowthRate || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageEmployeeTurnoverRate: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.employeeTurnoverRate !== null) :
        teamMetrics.filter(tm => tm.employeeTurnoverRate !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, tm) => total + (tm.employeeTurnoverRate || 0), 0);
      return sum / filtered.length;
    },
    
    getAverageTeamTenure: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.averageTenureMonths !== null) :
        teamMetrics.filter(tm => tm.averageTenureMonths !== null);
      
      if (filtered.length === 0) return 0;
      const sum = filtered.reduce((total, tm) => total + (tm.averageTenureMonths || 0), 0);
      return sum / filtered.length;
    },
    
    getLatestEmployeeCount: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.totalEmployees !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.totalEmployees || 0;
    },
    
    getLatestEmployeeGrowthRate: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.employeeGrowthRate !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.employeeGrowthRate || 0;
    },
    
    getLatestTurnoverRate: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.employeeTurnoverRate !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.employeeTurnoverRate || 0;
    },
    
    getLatestTenure: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.averageTenureMonths !== null)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        });
      
      return companyMetrics[0]?.averageTenureMonths || 0;
    },
    
    // Staff cost calculation helpers
    getTotalStaffCosts: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.staffCostsTotal !== null) :
        teamMetrics.filter(tm => tm.staffCostsTotal !== null);
      
      return filtered.reduce((total, tm) => total + (tm.staffCostsTotal || 0), 0);
    },
    
    getAverageStaffCostPerEmployee: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId && tm.staffCostsTotal !== null && tm.totalEmployees !== null) :
        teamMetrics.filter(tm => tm.staffCostsTotal !== null && tm.totalEmployees !== null);
      
      if (filtered.length === 0) return 0;
      const totalCosts = filtered.reduce((sum, tm) => sum + (tm.staffCostsTotal || 0), 0);
      const totalEmployees = filtered.reduce((sum, tm) => sum + (tm.totalEmployees || 0), 0);
      
      return totalEmployees > 0 ? totalCosts / totalEmployees : 0;
    },
    
    getDepartmentDistribution: (companyId: number) => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        })[0];
      
      if (!latest) return {
        management: 0,
        salesMarketing: 0,
        researchDevelopment: 0,
        customerServiceSupport: 0,
        general: 0
      };
      
      return {
        management: latest.numberOfManagement || 0,
        salesMarketing: latest.numberOfSalesMarketingStaff || 0,
        researchDevelopment: latest.numberOfResearchDevelopmentStaff || 0,
        customerServiceSupport: latest.numberOfCustomerServiceSupportStaff || 0,
        general: latest.numberOfGeneralStaff || 0
      };
    },
    
    getDepartmentCostBreakdown: (companyId: number) => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        })[0];
      
      if (!latest) return {
        managementCosts: 0,
        salesMarketingCosts: 0,
        researchDevelopmentCosts: 0,
        customerServiceSupportCosts: 0,
        generalCosts: 0,
        totalCosts: 0
      };
      
      return {
        managementCosts: latest.managementCosts || 0,
        salesMarketingCosts: latest.salesMarketingStaffCosts || 0,
        researchDevelopmentCosts: latest.researchDevelopmentStaffCosts || 0,
        customerServiceSupportCosts: latest.customerServiceSupportStaffCosts || 0,
        generalCosts: latest.generalStaffCosts || 0,
        totalCosts: latest.staffCostsTotal || 0
      };
    },
    
    // Team trend analysis
    getTeamTrend: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[a.quarter] - qOrder[b.quarter];
          }
          return 0;
        });
      
      return companyMetrics.map(tm => ({
        year: tm.year,
        quarter: tm.quarter,
        totalEmployees: tm.totalEmployees || 0,
        fullTimeEmployees: tm.fullTimeEmployees || 0,
        contractors: tm.contractors || 0,
        employeeGrowthRate: tm.employeeGrowthRate || 0,
        employeeTurnoverRate: tm.employeeTurnoverRate || 0,
        staffCostsTotal: tm.staffCostsTotal || 0,
        date: tm.date
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
    
    formatNumber: (number: number | null): string => {
      if (number === null || number === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US').format(number);
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
    getPeriodLabel: (teamMetric: typeof teamMetrics[0]): string => {
      if (teamMetric.fullYear) return `${teamMetric.year} (Full Year)`;
      if (teamMetric.quarter) return `${teamMetric.year} ${teamMetric.quarter}`;
      if (teamMetric.semester) return `${teamMetric.year} ${teamMetric.semester}`;
      if (teamMetric.month) return `${teamMetric.month} ${teamMetric.year}`;
      return `${teamMetric.year}`;
    },
    
    getLatestMetricsForCompany: (companyId: number) => {
      const companyMetrics = teamMetrics
        .filter(tm => tm.companyId === companyId)
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
    isGrowingTeam: (companyId: number): boolean => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.employeeGrowthRate !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.employeeGrowthRate || 0) > 0 : false;
    },
    
    hasHealthyTurnoverRate: (companyId: number, threshold: number = 15): boolean => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.employeeTurnoverRate !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.employeeTurnoverRate || 0) <= threshold : false;
    },
    
    hasGoodRetention: (companyId: number, minTenureMonths: number = 18): boolean => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.averageTenureMonths !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.averageTenureMonths || 0) >= minTenureMonths : false;
    },
    
    isTeamSizeHealthy: (companyId: number, minEmployees: number = 5): boolean => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId && tm.totalEmployees !== null)
        .sort((a, b) => b.year - a.year)[0];
      
      return latest ? (latest.totalEmployees || 0) >= minEmployees : false;
    },
    
    hasBalancedTeam: (companyId: number): boolean => {
      const latest = teamMetrics
        .filter(tm => tm.companyId === companyId)
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.quarter && b.quarter) {
            const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
            return qOrder[b.quarter] - qOrder[a.quarter];
          }
          return 0;
        })[0];
      
      if (!latest) return false;
      
      const total = (latest.numberOfManagement || 0) + 
                   (latest.numberOfSalesMarketingStaff || 0) + 
                   (latest.numberOfResearchDevelopmentStaff || 0) + 
                   (latest.numberOfCustomerServiceSupportStaff || 0) + 
                   (latest.numberOfGeneralStaff || 0);
      
      if (total === 0) return false;
      
      // Check if any single department doesn't dominate (>80% of team)
      const maxDepartmentSize = Math.max(
        latest.numberOfManagement || 0,
        latest.numberOfSalesMarketingStaff || 0,
        latest.numberOfResearchDevelopmentStaff || 0,
        latest.numberOfCustomerServiceSupportStaff || 0,
        latest.numberOfGeneralStaff || 0
      );
      
      return (maxDepartmentSize / total) <= 0.8;
    },
    
    // Summary helpers
    getTeamSummary: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId) :
        teamMetrics;
      
      const totalEmployeesSum = filtered.reduce((sum, tm) => sum + (tm.totalEmployees || 0), 0);
      const totalContractorsSum = filtered.reduce((sum, tm) => sum + (tm.contractors || 0), 0);
      const totalStaffCostsSum = filtered.reduce((sum, tm) => sum + (tm.staffCostsTotal || 0), 0);
      
      const metricsWithGrowth = filtered.filter(tm => tm.employeeGrowthRate !== null);
      const avgGrowthRate = metricsWithGrowth.length > 0 ? 
        metricsWithGrowth.reduce((sum, tm) => sum + (tm.employeeGrowthRate || 0), 0) / metricsWithGrowth.length : 0;
      
      const metricsWithTurnover = filtered.filter(tm => tm.employeeTurnoverRate !== null);
      const avgTurnoverRate = metricsWithTurnover.length > 0 ? 
        metricsWithTurnover.reduce((sum, tm) => sum + (tm.employeeTurnoverRate || 0), 0) / metricsWithTurnover.length : 0;
      
      return {
        totalEmployees: totalEmployeesSum,
        totalContractors: totalContractorsSum,
        totalStaffCosts: totalStaffCostsSum,
        averageGrowthRate: avgGrowthRate,
        averageTurnoverRate: avgTurnoverRate,
        isGrowingTeam: avgGrowthRate > 0,
        hasHealthyTurnover: avgTurnoverRate <= 15,
        metricsCount: filtered.length,
        uniqueCompanies: [...new Set(filtered.map(tm => tm.companyId))].length
      };
    },
    
    getCostEfficiencySummary: (companyId?: number) => {
      const filtered = companyId ? 
        teamMetrics.filter(tm => tm.companyId === companyId) :
        teamMetrics;
      
      const metricsWithCostData = filtered.filter(tm => 
        tm.staffCostsTotal !== null && tm.totalEmployees !== null && tm.totalEmployees > 0
      );
      
      const avgCostPerEmployee = metricsWithCostData.length > 0 ? 
        metricsWithCostData.reduce((sum, tm) => {
          const costPerEmployee = (tm.staffCostsTotal || 0) / (tm.totalEmployees || 1);
          return sum + costPerEmployee;
        }, 0) / metricsWithCostData.length : 0;
      
      const totalStaffCosts = filtered.reduce((sum, tm) => sum + (tm.staffCostsTotal || 0), 0);
      const totalEmployees = filtered.reduce((sum, tm) => sum + (tm.totalEmployees || 0), 0);
      
      return {
        averageCostPerEmployee: avgCostPerEmployee,
        totalStaffCosts,
        totalEmployees,
        overallCostPerEmployee: totalEmployees > 0 ? totalStaffCosts / totalEmployees : 0,
        metricsCount: filtered.length
      };
    }
  };
}

export default useTeamMetrics;