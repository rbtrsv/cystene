'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePerformanceStore } from '@/modules/assetmanager/store/performance.store';
import type { 
  FundPerformance, 
  StakeholderPerformance,
  CompanyPerformance 
} from '@/modules/assetmanager/schemas/performance.schemas';

export interface PerformanceContextType {
  fundPerformance: FundPerformance | null;
  stakeholderPerformances: StakeholderPerformance[];
  companyPerformance: CompanyPerformance | null;
  companyPerformances: CompanyPerformance[];
  isLoading: boolean;
  error: string | null;
  fetchFundPerformance: (fundId: number, roundId?: number, endDate?: Date) => Promise<boolean>;
  fetchStakeholdersPerformance: (fundId: number, roundId?: number, endDate?: Date) => Promise<boolean>;
  fetchCompanyPerformance: (companyId: number, endDate?: Date) => Promise<boolean>;
  fetchCompaniesPerformance: (fundId?: number, endDate?: Date) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
  hasPerformanceData: () => boolean;
  getFundStakeholders: (fundId: number) => StakeholderPerformance[];
  getCompanyById: (companyId: number) => CompanyPerformance | undefined;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ 
  children,
  initialFetch = false
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  const {
    fundPerformance, 
    stakeholderPerformances,
    companyPerformance,
    companyPerformances,
    isLoading, 
    error,
    fetchFundPerformance, 
    fetchStakeholdersPerformance,
    fetchCompanyPerformance,
    fetchCompaniesPerformance,
    clearError,
    reset,
    hasPerformanceData,
    getFundStakeholders,
    getCompanyById
  } = usePerformanceStore();
  
  const contextValue = useMemo<PerformanceContextType>(() => ({
    fundPerformance, 
    stakeholderPerformances,
    companyPerformance,
    companyPerformances,
    isLoading, 
    error,
    fetchFundPerformance, 
    fetchStakeholdersPerformance,
    fetchCompanyPerformance,
    fetchCompaniesPerformance,
    clearError,
    reset,
    hasPerformanceData,
    getFundStakeholders,
    getCompanyById
  }), [
    fundPerformance, 
    stakeholderPerformances,
    companyPerformance,
    companyPerformances,
    isLoading, 
    error,
    fetchFundPerformance, 
    fetchStakeholdersPerformance,
    fetchCompanyPerformance,
    fetchCompaniesPerformance,
    clearError,
    reset,
    hasPerformanceData,
    getFundStakeholders,
    getCompanyById
  ]);
  
  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext(): PerformanceContextType {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}