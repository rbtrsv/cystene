'use client';

import { useKpisContext } from '../providers/kpis-provider';
import { useKpisStore } from '../store/kpis.store';
import { 
  type CreateKpiInput, 
  type UpdateKpiInput,
  type CreateKpiValueInput,
  type UpdateKpiValueInput,
  type KpiDataType,
  type FinancialScenario,
  type Quarter,
  type Semester,
  type Month
} from '../schemas/kpis.schemas';

/**
 * Custom hook that combines KPIs context and store
 * to provide a simplified interface for KPIs functionality
 * 
 * @returns KPIs utilities and state
 */
export function useKpis() {
  // Get data from KPIs context
  const {
    kpis,
    selectedKpi,
    kpiValues,
    selectedKpiValue,
    isLoading: contextLoading,
    error: contextError,
    fetchKpis,
    fetchKpi,
    fetchAllKpiValues,
    fetchKpiValues,
    fetchKpiValue,
    setSelectedKpi,
    setSelectedKpiValue,
    clearError: clearContextError
  } = useKpisContext();

  // Get additional actions from KPIs store
  const {
    createKpi,
    updateKpi,
    deleteKpi,
    createKpiValue,
    updateKpiValue,
    deleteKpiValue,
    getKpisByCompany,
    getKpiValuesByKpi,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useKpisStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addKpi = async (data: CreateKpiInput): Promise<boolean> => {
    return await createKpi(data);
  };

  const editKpi = async (id: number, data: UpdateKpiInput): Promise<boolean> => {
    return await updateKpi(id, data);
  };

  const removeKpi = async (id: number): Promise<boolean> => {
    return await deleteKpi(id);
  };

  // KPI Values wrapper functions
  const addKpiValue = async (data: CreateKpiValueInput): Promise<boolean> => {
    return await createKpiValue(data);
  };

  const editKpiValue = async (id: number, data: UpdateKpiValueInput): Promise<boolean> => {
    return await updateKpiValue(id, data);
  };

  const removeKpiValue = async (id: number): Promise<boolean> => {
    return await deleteKpiValue(id);
  };

  return {
    // KPI Definitions State
    kpis,
    selectedKpi,
    
    // KPI Values State
    kpiValues,
    selectedKpiValue,
    
    // Common State
    isLoading,
    error,
    
    // KPI Definition Actions
    fetchKpis,
    fetchKpi,
    addKpi,
    editKpi,
    removeKpi,
    setSelectedKpi,
    
    // KPI Values Actions
    fetchAllKpiValues,
    fetchKpiValues,
    fetchKpiValue,
    addKpiValue,
    editKpiValue,
    removeKpiValue,
    setSelectedKpiValue,
    
    // Common Actions
    clearError,
    
    // KPI Definition Helper methods
    hasKpis: () => kpis.length > 0,
    getKpiById: (id: number) => kpis.find(kpi => kpi.id === id),
    
    // KPI Definition Filter helpers
    getKpisByCompany: (companyId: number) => getKpisByCompany(companyId),
    getKpisByDataType: (dataType: KpiDataType) => 
      kpis.filter(kpi => kpi.dataType === dataType),
    getCalculatedKpis: () => 
      kpis.filter(kpi => kpi.isCalculated === true),
    getManualKpis: () => 
      kpis.filter(kpi => kpi.isCalculated === false),
    
    // KPI Values Helper methods
    hasKpiValues: () => kpiValues.length > 0,
    getKpiValueById: (id: number) => kpiValues.find(kv => kv.id === id),
    
    // KPI Values Filter helpers
    getKpiValuesByKpi: (kpiId: number) => getKpiValuesByKpi(kpiId),
    getKpiValuesByYear: (year: number) => 
      kpiValues.filter(kv => kv.year === year),
    getKpiValuesByScenario: (scenario: FinancialScenario) => 
      kpiValues.filter(kv => kv.scenario === scenario),
    getKpiValuesByQuarter: (quarter: Quarter) => 
      kpiValues.filter(kv => kv.quarter === quarter),
    getKpiValuesBySemester: (semester: Semester) => 
      kpiValues.filter(kv => kv.semester === semester),
    getKpiValuesByMonth: (month: Month) => 
      kpiValues.filter(kv => kv.month === month),
    getFullYearKpiValues: () => 
      kpiValues.filter(kv => kv.fullYear === true),
    
    // Formatting helpers
    formatDate: (date: Date | string | null): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    formatKpiValue: (value: number | null, dataType: KpiDataType): string => {
      if (value === null || value === undefined) return 'N/A';
      
      switch (dataType) {
        case 'DECIMAL':
          return value.toFixed(2);
        case 'INTEGER':
          return Math.round(value).toString();
        case 'STRING':
          return value.toString();
        default:
          return value.toString();
      }
    },
    
    // Business logic helpers
    getKpiDisplayName: (kpi: typeof kpis[0]): string => {
      return kpi.name + (kpi.isCalculated ? ' (Calculated)' : '');
    },
    
    getKpiTypeLabel: (dataType: KpiDataType): string => {
      switch (dataType) {
        case 'DECIMAL':
          return 'Decimal Number';
        case 'INTEGER':
          return 'Whole Number';
        case 'STRING':
          return 'Text';
        default:
          return 'Unknown';
      }
    },
    
    getPeriodLabel: (kpiValue: typeof kpiValues[0]): string => {
      if (kpiValue.fullYear) return `${kpiValue.year} (Full Year)`;
      if (kpiValue.quarter) return `${kpiValue.year} ${kpiValue.quarter}`;
      if (kpiValue.semester) return `${kpiValue.year} ${kpiValue.semester}`;
      if (kpiValue.month) return `${kpiValue.month} ${kpiValue.year}`;
      return `${kpiValue.year}`;
    }
  };
}

export default useKpis;