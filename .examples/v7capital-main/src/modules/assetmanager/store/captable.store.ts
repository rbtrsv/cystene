'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  CapTableRow, 
  CapTableSummary, 
  CapTableFilters 
} from '@/modules/assetmanager/schemas/captable.schemas';

interface CapTableState {
  // Data
  capTable: CapTableRow[];
  summary: CapTableSummary | null;
  availableRounds: Array<{ id: number; roundName: string; roundDate: string }>;
  
  // UI State
  loading: boolean;
  error: string | null;
  filters: CapTableFilters;
  selectedRoundId: number | null; // null = current/latest
  
  // Actions
  setCapTable: (data: CapTableRow[]) => void;
  setSummary: (data: CapTableSummary) => void;
  setAvailableRounds: (rounds: Array<{ id: number; roundName: string; roundDate: string }>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<CapTableFilters>) => void;
  setSelectedRound: (roundId: number | null) => void;
  
  // Computed
  filteredCapTable: () => CapTableRow[];
  
  // Reset
  reset: () => void;
}

const initialState = {
  capTable: [],
  summary: null,
  availableRounds: [],
  loading: false,
  error: null,
  filters: {
    fundId: undefined,
    asOfRoundId: undefined,
    stakeholderTypes: [],
    securityTypes: [],
    minOwnership: undefined,
    maxOwnership: undefined,
  },
  selectedRoundId: null,
};

export const useCapTableStore = create<CapTableState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setCapTable: (data) => set({ capTable: data }),
      setSummary: (data) => set({ summary: data }),
      setAvailableRounds: (rounds) => set({ availableRounds: rounds }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      setSelectedRound: (roundId) => set({ selectedRoundId: roundId }),
      
      filteredCapTable: () => {
        const { capTable, filters } = get();
        
        return capTable.filter((row) => {
          // Filter by stakeholder types
          if (filters.stakeholderTypes && filters.stakeholderTypes.length > 0) {
            if (!filters.stakeholderTypes.includes(row.stakeholderType)) {
              return false;
            }
          }
          
          // Filter by ownership percentage range
          if (filters.minOwnership !== undefined && row.equityOwnershipPercentage < filters.minOwnership) {
            return false;
          }
          
          if (filters.maxOwnership !== undefined && row.equityOwnershipPercentage > filters.maxOwnership) {
            return false;
          }
          
          // Filter by security types - check if stakeholder has any of the specified security types
          if (filters.securityTypes && filters.securityTypes.length > 0) {
            let hasSecurityType = false;
            
            for (const securityType of filters.securityTypes) {
              switch (securityType) {
                case 'COMMON_STOCK':
                  if (row.commonShares > 0) hasSecurityType = true;
                  break;
                case 'PREFERRED_STOCK':
                  if (row.preferredShares > 0) hasSecurityType = true;
                  break;
                case 'STOCK_OPTION':
                  if (row.options > 0) hasSecurityType = true;
                  break;
                case 'WARRANT':
                  if (row.warrants > 0) hasSecurityType = true;
                  break;
                case 'CONVERTIBLE_NOTE':
                case 'CONVERTIBLE_BOND':
                  if (row.convertibles > 0) hasSecurityType = true;
                  break;
              }
              if (hasSecurityType) break;
            }
            
            if (!hasSecurityType) return false;
          }
          
          return true;
        });
      },
      
      reset: () => set(initialState),
    }),
    { name: 'cap-table-store' }
  )
);
