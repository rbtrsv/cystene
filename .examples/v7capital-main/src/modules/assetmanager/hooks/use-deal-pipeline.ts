'use client';

import { useDealPipelineContext } from '../providers/deal-pipeline-provider';
import { useDealPipelineStore } from '../store/deal-pipeline.store';
import { 
  type DealPipeline, 
  type CreateDealPipelineInput, 
  type UpdateDealPipelineInput,
  type DealStatus,
  type DealPriority,
  type SectorType
} from '../schemas/deal-pipeline.schemas';

/**
 * Custom hook that combines deal pipeline context and store
 * to provide a simplified interface for deal pipeline functionality
 * 
 * @returns Deal pipeline utilities and state
 */
export function useDealPipeline() {
  // Get data from deal pipeline context
  const {
    dealPipelines,
    selectedDealPipeline,
    isLoading: contextLoading,
    error: contextError,
    fetchDealPipelines,
    fetchDealPipeline,
    setSelectedDealPipeline,
    clearError: clearContextError
  } = useDealPipelineContext();

  // Get additional actions from deal pipeline store
  const {
    createDealPipeline,
    updateDealPipeline,
    deleteDealPipeline,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useDealPipelineStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  // Wrapper functions for consistent API
  const addDealPipeline = async (data: CreateDealPipelineInput): Promise<boolean> => {
    return await createDealPipeline(data);
  };

  const editDealPipeline = async (id: number, data: UpdateDealPipelineInput): Promise<boolean> => {
    return await updateDealPipeline(id, data);
  };

  const removeDealPipeline = async (id: number): Promise<boolean> => {
    return await deleteDealPipeline(id);
  };

  return {
    // State
    dealPipelines,
    selectedDealPipeline,
    isLoading,
    error,
    
    // Actions
    fetchDealPipelines,
    fetchDealPipeline,
    addDealPipeline,
    editDealPipeline,
    removeDealPipeline,
    setSelectedDealPipeline,
    clearError,
    
    // Helper methods
    hasDealPipelines: () => dealPipelines.length > 0,
    getDealPipelineById: (id: number) => dealPipelines.find(dp => dp.id === id),
    getDealPipelineName: (id: number) => {
      const dealPipeline = dealPipelines.find(dp => dp.id === id);
      return dealPipeline ? dealPipeline.dealName : 'Unknown Deal';
    },
    
    // Filter helpers
    getDealPipelinesByCompany: (companyId: number) => 
      dealPipelines.filter(dp => dp.companyId === companyId),
    
    getDealPipelinesByStatus: (status: DealStatus) => 
      dealPipelines.filter(dp => dp.status === status),
    
    getDealPipelinesByPriority: (priority: DealPriority) => 
      dealPipelines.filter(dp => dp.priority === priority),
    
    getDealPipelinesBySector: (sector: SectorType) => 
      dealPipelines.filter(dp => dp.sector === sector),
    
    getActiveDealPipelines: () => 
      dealPipelines.filter(dp => dp.status !== 'Closed' && dp.status !== 'Rejected'),
    
    getClosedDealPipelines: () => 
      dealPipelines.filter(dp => dp.status === 'Closed'),
    
    getRejectedDealPipelines: () => 
      dealPipelines.filter(dp => dp.status === 'Rejected'),
    
    // Calculation helpers
    getAveragePreMoneyValuation: () => {
      const dealsWithValuation = dealPipelines.filter(dp => dp.preMoneyValuation && dp.preMoneyValuation > 0);
      if (dealsWithValuation.length === 0) return 0;
      
      const totalValuation = dealsWithValuation.reduce((sum, deal) => {
        return sum + (deal.preMoneyValuation || 0);
      }, 0);
      
      return totalValuation / dealsWithValuation.length;
    },
    
    getAveragePostMoneyValuation: () => {
      const dealsWithValuation = dealPipelines.filter(dp => dp.postMoneyValuation && dp.postMoneyValuation > 0);
      if (dealsWithValuation.length === 0) return 0;
      
      const totalValuation = dealsWithValuation.reduce((sum, deal) => {
        return sum + (deal.postMoneyValuation || 0);
      }, 0);
      
      return totalValuation / dealsWithValuation.length;
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
    
    formatDate: (date: Date | string): string => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    // Status helpers
    getDealStatusLabel: (status: DealStatus): string => {
      return status;
    },
    
    getDealPriorityLabel: (priority: DealPriority): string => {
      const priorityLabels: Record<DealPriority, string> = {
        'P1': 'High Priority',
        'P2': 'Medium-High Priority',
        'P3': 'Medium Priority',
        'P4': 'Medium-Low Priority',
        'P5': 'Low Priority'
      };
      
      return priorityLabels[priority] || priority;
    },
    
    // Business logic helpers
    isDealActive: (dealId: number): boolean => {
      const deal = dealPipelines.find(dp => dp.id === dealId);
      return deal ? deal.status !== 'Closed' && deal.status !== 'Rejected' : false;
    },
    
    getDealStageProgress: (status: DealStatus): number => {
      const stages: DealStatus[] = [
        'Initial Screening',
        'First Meeting',
        'Follow Up',
        'Due Diligence',
        'Negotiation',
        'Term Sheet',
        'Legal Review',
        'Closing',
        'Closed'
      ];
      
      const currentStageIndex = stages.indexOf(status);
      return currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;
    }
  };
}

export default useDealPipeline;