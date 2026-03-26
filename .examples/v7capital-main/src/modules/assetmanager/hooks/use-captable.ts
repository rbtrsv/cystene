'use client';

import { useCapTableContext } from '@/modules/assetmanager/providers/captable-provider';
import type { ExportFormat, CapTableFilters } from '@/modules/assetmanager/schemas/captable.schemas';

/**
 * Custom hook that provides cap table functionality
 * Must be used within a CapTableProvider
 */
export function useCapTable() {
  const context = useCapTableContext();
  
  return {
    // Data
    capTable: context.capTable,
    summary: context.summary,
    availableRounds: context.availableRounds,
    filteredCapTable: context.filteredCapTable(),
    
    // State
    loading: context.loading,
    error: context.error,
    filters: context.filters,
    selectedRoundId: context.selectedRoundId,
    
    // Actions
    loadCapTable: context.loadCapTable,
    loadSummary: context.loadSummary,
    loadAvailableRounds: context.loadAvailableRounds,
    loadFundData: context.loadFundData,
    exportData: context.exportData,
    setFilters: context.setFilters,
    setSelectedRound: context.setSelectedRound,
    reset: context.reset,
    
    // Computed values
    hasData: context.capTable.length > 0,
    isEmpty: context.capTable.length === 0 && !context.loading,
    isHistoricalView: context.selectedRoundId !== null,
    
    // Convenience methods
    exportCSV: (fundId: number) => context.exportData(fundId, 'csv', context.selectedRoundId || undefined),
    exportExcel: (fundId: number) => context.exportData(fundId, 'excel', context.selectedRoundId || undefined),
    
    // Filter helpers
    filterByStakeholderType: (types: string[]) => 
      context.setFilters({ stakeholderTypes: types }),
    filterBySecurityType: (types: string[]) => 
      context.setFilters({ securityTypes: types }),
    filterByOwnership: (min?: number, max?: number) => 
      context.setFilters({ minOwnership: min, maxOwnership: max }),
    clearFilters: () => 
      context.setFilters({ 
        stakeholderTypes: [], 
        securityTypes: [], 
        minOwnership: undefined, 
        maxOwnership: undefined 
      }),
      
    // Round navigation
    goToCurrentRound: () => context.setSelectedRound(null),
    goToRound: (roundId: number) => context.setSelectedRound(roundId),
  };
}

/**
 * Hook for cap table statistics and calculations
 */
export function useCapTableStats() {
  const { filteredCapTable, summary } = useCapTable();
  
  const totalStakeholders = filteredCapTable.length;
  const totalEquityShares = filteredCapTable.reduce((sum, row) => sum + row.totalEquityShares, 0);
  const totalFullyDilutedShares = filteredCapTable.reduce((sum, row) => sum + row.totalFullyDilutedShares, 0);
  const totalInvestment = filteredCapTable.reduce((sum, row) => sum + row.totalInvestment, 0);
  
  // Security type breakdowns
  const securityBreakdown = {
    commonShares: filteredCapTable.reduce((sum, row) => sum + row.commonShares, 0),
    preferredShares: filteredCapTable.reduce((sum, row) => sum + row.preferredShares, 0),
    options: filteredCapTable.reduce((sum, row) => sum + row.options, 0),
    warrants: filteredCapTable.reduce((sum, row) => sum + row.warrants, 0),
    convertibles: filteredCapTable.reduce((sum, row) => sum + row.convertibles, 0),
  };
  
  // Stakeholder type breakdowns
  const stakeholderTypeBreakdown = filteredCapTable.reduce((acc, row) => {
    const type = row.stakeholderType;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalEquityShares: 0,
        totalInvestment: 0,
        ownershipPercentage: 0,
      };
    }
    acc[type].count += 1;
    acc[type].totalEquityShares += row.totalEquityShares;
    acc[type].totalInvestment += row.totalInvestment;
    acc[type].ownershipPercentage += row.equityOwnershipPercentage;
    return acc;
  }, {} as Record<string, { count: number; totalEquityShares: number; totalInvestment: number; ownershipPercentage: number }>);
  
  return {
    // Totals
    totalStakeholders,
    totalEquityShares,
    totalFullyDilutedShares,
    totalInvestment,
    
    // Breakdowns
    securityBreakdown,
    stakeholderTypeBreakdown,
    
    // From summary (if available)
    fundName: summary?.fundName,
    totalValuation: summary?.totalValuation,
    asOfRoundName: summary?.asOfRoundName,
    lastUpdated: summary?.lastUpdated,
    
    // Calculated metrics
    averageInvestmentPerStakeholder: totalStakeholders > 0 ? totalInvestment / totalStakeholders : 0,
    dilutionRatio: totalEquityShares > 0 ? (totalFullyDilutedShares - totalEquityShares) / totalEquityShares : 0,
  };
}
