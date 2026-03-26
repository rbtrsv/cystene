'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useCapTableStore } from '@/modules/assetmanager/store/captable.store';
import { 
  getCapTable, 
  getCapTableSummary, 
  getFundRounds, 
  exportCapTable 
} from '@/modules/assetmanager/actions/captable.actions';
import type { 
  CapTableRow, 
  CapTableSummary, 
  CapTableFilters, 
  ExportFormat 
} from '@/modules/assetmanager/schemas/captable.schemas';

interface CapTableContextValue {
  // Data and state from store
  capTable: CapTableRow[];
  summary: CapTableSummary | null;
  availableRounds: Array<{ id: number; roundName: string; roundDate: string }>;
  loading: boolean;
  error: string | null;
  filters: CapTableFilters;
  selectedRoundId: number | null;
  filteredCapTable: () => CapTableRow[];
  
  // Actions
  loadCapTable: (fundId: number, asOfRoundId?: number) => Promise<void>;
  loadSummary: (fundId: number, asOfRoundId?: number) => Promise<void>;
  loadAvailableRounds: (fundId: number) => Promise<void>;
  loadFundData: (fundId: number) => Promise<void>; // Add this new method
  exportData: (fundId: number, format: ExportFormat, asOfRoundId?: number) => Promise<void>;
  setFilters: (filters: Partial<CapTableFilters>) => void;
  setSelectedRound: (roundId: number | null) => void;
  reset: () => void;
}

const CapTableContext = createContext<CapTableContextValue | null>(null);

interface CapTableProviderProps {
  children: React.ReactNode;
  fundId?: number; // Make fundId optional
  autoLoad?: boolean;
}

export function CapTableProvider({ 
  children, 
  fundId, 
  autoLoad = true 
}: CapTableProviderProps) {
  const store = useCapTableStore();
  
  // Load initial data
  const loadCapTable = useCallback(async (currentFundId: number, asOfRoundId?: number) => {
    store.setLoading(true);
    store.setError(null);
    
    try {
      const result = await getCapTable(currentFundId, asOfRoundId);
      
      if (result.success && result.data) {
        store.setCapTable(result.data);
      } else {
        store.setError(result.error || 'Failed to load cap table');
      }
    } catch (error) {
      store.setError('Failed to load cap table');
      console.error('Error loading cap table:', error);
    } finally {
      store.setLoading(false);
    }
  }, [store]);
  
  const loadSummary = useCallback(async (currentFundId: number, asOfRoundId?: number) => {
    try {
      const result = await getCapTableSummary(currentFundId, asOfRoundId);
      
      if (result.success && result.data) {
        store.setSummary(result.data);
      } else {
        console.error('Failed to load cap table summary:', result.error);
      }
    } catch (error) {
      console.error('Error loading cap table summary:', error);
    }
  }, [store]);
  
  const loadAvailableRounds = useCallback(async (currentFundId: number) => {
    try {
      const result = await getFundRounds(currentFundId);
      
      if (result.success && result.data) {
        store.setAvailableRounds(result.data);
      } else {
        console.error('Failed to load available rounds:', result.error);
      }
    } catch (error) {
      console.error('Error loading available rounds:', error);
    }
  }, [store]);
  
  // Load all fund data (cap table, summary, and rounds)
  const loadFundData = async (currentFundId: number) => {
    await Promise.all([
      loadCapTable(currentFundId),
      loadSummary(currentFundId),
      loadAvailableRounds(currentFundId)
    ]);
  };
  
  const exportData = async (currentFundId: number, format: ExportFormat, asOfRoundId?: number) => {
    try {
      const result = await exportCapTable(currentFundId, format, asOfRoundId);
      
      if (result.success && result.data) {
        // Create blob and download file
        const blob = new Blob([result.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cap-table-${currentFundId}${asOfRoundId ? `-round-${asOfRoundId}` : ''}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        store.setError(result.error || 'Failed to export cap table');
      }
    } catch (error) {
      store.setError('Failed to export cap table');
      console.error('Error exporting cap table:', error);
    }
  };
  
  // Auto-load data when component mounts or fundId changes
  useEffect(() => {
    if (autoLoad && fundId) {
      loadCapTable(fundId);
      loadSummary(fundId);
      loadAvailableRounds(fundId);
    }
  }, [fundId, autoLoad, loadCapTable, loadSummary, loadAvailableRounds]);
  
  // Reload cap table and summary when selectedRoundId changes
  useEffect(() => {
    if (fundId && store.selectedRoundId !== null) {
      loadCapTable(fundId, store.selectedRoundId);
      loadSummary(fundId, store.selectedRoundId);
    } else if (fundId && store.selectedRoundId === null) {
      // Load current/latest data
      loadCapTable(fundId);
      loadSummary(fundId);
    }
  }, [fundId, store.selectedRoundId, loadCapTable, loadSummary]);
  
  const contextValue: CapTableContextValue = {
    // Data and state
    capTable: store.capTable,
    summary: store.summary,
    availableRounds: store.availableRounds,
    loading: store.loading,
    error: store.error,
    filters: store.filters,
    selectedRoundId: store.selectedRoundId,
    filteredCapTable: store.filteredCapTable,
    
    // Actions
    loadCapTable,
    loadSummary,
    loadAvailableRounds,
    loadFundData,
    exportData,
    setFilters: store.setFilters,
    setSelectedRound: store.setSelectedRound,
    reset: store.reset,
  };
  
  return (
    <CapTableContext.Provider value={contextValue}>
      {children}
    </CapTableContext.Provider>
  );
}

export function useCapTableContext() {
  const context = useContext(CapTableContext);
  
  if (!context) {
    throw new Error('useCapTableContext must be used within a CapTableProvider');
  }
  
  return context;
}
