'use client';

import { usePerformanceContext } from '@/modules/assetmanager/providers/performance-provider';
import { usePerformanceStore } from '@/modules/assetmanager/store/performance.store';
import type { 
  FundPerformance, 
  StakeholderPerformance,
  CompanyPerformance 
} from '@/modules/assetmanager/schemas/performance.schemas';

/**
 * Custom hook that combines performance context and store
 * to provide a simplified interface for performance functionality
 * 
 * @returns Performance utilities and state
 */
export function usePerformance() {
  // Get data from performance context
  const {
    fundPerformance,
    stakeholderPerformances,
    companyPerformance,
    companyPerformances,
    isLoading: contextLoading,
    error: contextError,
    fetchFundPerformance,
    fetchStakeholdersPerformance,
    fetchCompanyPerformance,
    fetchCompaniesPerformance,
    clearError: clearContextError,
    reset,
    hasPerformanceData,
    getFundStakeholders,
    getCompanyById
  } = usePerformanceContext();

  // Get additional state from performance store (if needed)
  const {
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = usePerformanceStore();

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
    fundPerformance,
    stakeholderPerformances,
    companyPerformance,
    companyPerformances,
    isLoading,
    error,
    
    // Fetch actions
    fetchFundPerformance,
    fetchStakeholdersPerformance,
    fetchCompanyPerformance,
    fetchCompaniesPerformance,
    
    // Utility actions
    clearError,
    reset,
    
    // Helper methods
    hasPerformanceData,
    getFundStakeholders,
    getCompanyById,
    
    getPerformanceById: (stakeholderId: number) => 
      stakeholderPerformances.find(p => p.stakeholderId === stakeholderId),
    
    getStakeholderName: (stakeholderId: number): string => {
      const performance = stakeholderPerformances.find(p => p.stakeholderId === stakeholderId);
      return performance ? performance.stakeholderName : 'Unknown Stakeholder';
    },
    
    getCompanyName: (companyId: number): string => {
      const performance = companyPerformances.find(p => p.companyId === companyId);
      return performance ? performance.companyName : 'Unknown Company';
    },
    
    getCompanyPerformanceById: (companyId: number) => 
      companyPerformances.find(p => p.companyId === companyId),
    
    formatPercentage: (value: number | null): string => {
      if (value === null || value === undefined) return 'N/A';
      return `${(value * 100).toFixed(2)}%`;
    },
    
    formatCurrency: (amount: number | null): string => {
      if (amount === null || amount === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    },
    
    formatRatio: (ratio: number | null): string => {
      if (ratio === null || ratio === undefined) return 'N/A';
      return `${ratio.toFixed(2)}x`;
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
    getTopPerformers: (limit: number = 5) => {
      return [...stakeholderPerformances]
        .filter(p => p.irr !== null)
        .sort((a, b) => (b.irr || 0) - (a.irr || 0))
        .slice(0, limit);
    },
    
    getWorstPerformers: (limit: number = 5) => {
      return [...stakeholderPerformances]
        .filter(p => p.irr !== null)
        .sort((a, b) => (a.irr || 0) - (b.irr || 0))
        .slice(0, limit);
    },
    
    getTotalInvested: () => {
      return stakeholderPerformances.reduce((total, p) => total + p.totalInvested, 0);
    },
    
    getTotalReturned: () => {
      return stakeholderPerformances.reduce((total, p) => total + p.totalReturned, 0);
    },
    
    getAverageIRR: (): number | null => {
      const validIRRs = stakeholderPerformances
        .map(p => p.irr)
        .filter((irr): irr is number => irr !== null);
      
      if (validIRRs.length === 0) return null;
      return validIRRs.reduce((sum, irr) => sum + irr, 0) / validIRRs.length;
    },
    
    getAverageTVPI: (): number | null => {
      const validTVPIs = stakeholderPerformances
        .map(p => p.tvpi)
        .filter((tvpi): tvpi is number => tvpi !== null);
      
      if (validTVPIs.length === 0) return null;
      return validTVPIs.reduce((sum, tvpi) => sum + tvpi, 0) / validTVPIs.length;
    },
    
    // Company performance analysis helpers
    getTopCompanies: (limit: number = 5) => {
      return [...companyPerformances]
        .filter(p => p.irr !== null)
        .sort((a, b) => (b.irr || 0) - (a.irr || 0))
        .slice(0, limit);
    },
    
    getWorstCompanies: (limit: number = 5) => {
      return [...companyPerformances]
        .filter(p => p.irr !== null)
        .sort((a, b) => (a.irr || 0) - (b.irr || 0))
        .slice(0, limit);
    },
    
    getTotalInvestedInCompanies: () => {
      return companyPerformances.reduce((total, p) => total + p.totalInvested, 0);
    },
    
    getTotalReturnedFromCompanies: () => {
      return companyPerformances.reduce((total, p) => total + p.totalReturned, 0);
    },
    
    getCompaniesAverageIRR: (): number | null => {
      const validIRRs = companyPerformances
        .map(p => p.irr)
        .filter((irr): irr is number => irr !== null);
      
      if (validIRRs.length === 0) return null;
      return validIRRs.reduce((sum, irr) => sum + irr, 0) / validIRRs.length;
    },
    
    // Filter helpers
    getPerformanceByFund: (fundId: number) => {
      return stakeholderPerformances.filter(p => p.fundId === fundId);
    },
    
    getValidPerformances: () => {
      return stakeholderPerformances.filter(p => p.isValid);
    },
    
    getInvalidPerformances: () => {
      return stakeholderPerformances.filter(p => !p.isValid);
    },
    
    // Company filter helpers
    getValidCompanyPerformances: () => {
      return companyPerformances.filter(p => p.isValid);
    },
    
    getInvalidCompanyPerformances: () => {
      return companyPerformances.filter(p => !p.isValid);
    }
  };
}

export default usePerformance;