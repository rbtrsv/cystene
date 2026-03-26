'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type Kpi,
  type KpiValueWithRelations,
  type CreateKpiInput, 
  type UpdateKpiInput,
  type CreateKpiValueInput,
  type UpdateKpiValueInput
} from '../schemas/kpis.schemas';
import {
  getKpis,
  getKpi,
  createKpi,
  updateKpi,
  deleteKpi,
  getAllKpiValues,
  getKpiValues,
  getKpiValue,
  createKpiValue,
  updateKpiValue,
  deleteKpiValue
} from '../actions/kpis.actions';

/**
 * KPIs store state interface
 */
export interface KpisState {
  // KPI Definitions State
  kpis: Kpi[];
  selectedKpi: Kpi | null;
  
  // KPI Values State
  kpiValues: KpiValueWithRelations[];
  selectedKpiValue: KpiValueWithRelations | null;
  
  // Common State
  isLoading: boolean;
  error: string | null;
  
  // KPI Definition Actions
  fetchKpis: (companyId?: number) => Promise<boolean>;
  fetchKpi: (id: number) => Promise<boolean>;
  createKpi: (data: CreateKpiInput) => Promise<boolean>;
  updateKpi: (id: number, data: UpdateKpiInput) => Promise<boolean>;
  deleteKpi: (id: number) => Promise<boolean>;
  setSelectedKpi: (kpi: Kpi | null) => void;
  
  // KPI Values Actions
  fetchAllKpiValues: (companyId?: number) => Promise<boolean>;
  fetchKpiValues: (kpiId: number) => Promise<boolean>;
  fetchKpiValue: (id: number) => Promise<boolean>;
  createKpiValue: (data: CreateKpiValueInput) => Promise<boolean>;
  updateKpiValue: (id: number, data: UpdateKpiValueInput) => Promise<boolean>;
  deleteKpiValue: (id: number) => Promise<boolean>;
  setSelectedKpiValue: (kpiValue: KpiValueWithRelations | null) => void;
  
  // Common Actions
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getKpisByCompany: (companyId: number) => Kpi[];
  getKpiValuesByKpi: (kpiId: number) => KpiValueWithRelations[];
}

/**
 * Create KPIs store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useKpisStore = create<KpisState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        kpis: [],
        selectedKpi: null,
        kpiValues: [],
        selectedKpiValue: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch KPIs (optionally filtered by company)
         */
        fetchKpis: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getKpis(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.kpis = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch KPIs'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch a single KPI by ID
         */
        fetchKpi: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getKpi(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedKpi = response.data!;
                
                // Update in the list if it exists
                const index = state.kpis.findIndex(kpi => kpi.id === id);
                if (index !== -1) {
                  state.kpis[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch KPI'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a new KPI
         */
        createKpi: async (data: CreateKpiInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createKpi(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.kpis.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create KPI'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Update an existing KPI
         */
        updateKpi: async (id: number, data: UpdateKpiInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateKpi(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.kpis.findIndex(kpi => kpi.id === id);
                if (index !== -1) {
                  state.kpis[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedKpi?.id === id) {
                  state.selectedKpi = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update KPI'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Delete a KPI
         */
        deleteKpi: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteKpi(id);
            
            if (response.success) {
              set((state) => {
                state.kpis = state.kpis.filter(kpi => kpi.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedKpi?.id === id) {
                  state.selectedKpi = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete KPI'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Set the selected KPI
         */
        setSelectedKpi: (kpi: Kpi | null) => {
          set({ selectedKpi: kpi });
        },
        
        /**
         * Fetch all KPI values that the user has access to
         */
        fetchAllKpiValues: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getAllKpiValues(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.kpiValues = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch KPI values'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch KPI values for a specific KPI
         */
        fetchKpiValues: async (kpiId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getKpiValues(kpiId);
            
            if (response.success && response.data) {
              set((state) => {
                state.kpiValues = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch KPI values'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Fetch a single KPI value by ID
         */
        fetchKpiValue: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getKpiValue(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedKpiValue = response.data!;
                
                // Update in the list if it exists
                const index = state.kpiValues.findIndex(kv => kv.id === id);
                if (index !== -1) {
                  state.kpiValues[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch KPI value'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Create a new KPI value
         */
        createKpiValue: async (data: CreateKpiValueInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createKpiValue(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.kpiValues.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create KPI value'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Update an existing KPI value
         */
        updateKpiValue: async (id: number, data: UpdateKpiValueInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateKpiValue(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.kpiValues.findIndex(kv => kv.id === id);
                if (index !== -1) {
                  state.kpiValues[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedKpiValue?.id === id) {
                  state.selectedKpiValue = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update KPI value'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Delete a KPI value
         */
        deleteKpiValue: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteKpiValue(id);
            
            if (response.success) {
              set((state) => {
                state.kpiValues = state.kpiValues.filter(kv => kv.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedKpiValue?.id === id) {
                  state.selectedKpiValue = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete KPI value'
              });
              return false;
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            return false;
          }
        },
        
        /**
         * Set the selected KPI value
         */
        setSelectedKpiValue: (kpiValue: KpiValueWithRelations | null) => {
          set({ selectedKpiValue: kpiValue });
        },
        
        /**
         * Clear any error state
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset the entire store to initial state
         */
        reset: () => {
          set({ 
            kpis: [], 
            selectedKpi: null,
            kpiValues: [],
            selectedKpiValue: null,
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getKpisByCompany: (companyId: number) => {
          return get().kpis.filter(kpi => kpi.companyId === companyId);
        },
        
        getKpiValuesByKpi: (kpiId: number) => {
          return get().kpiValues.filter(kv => kv.kpiId === kpiId);
        }
      })),
      {
        name: 'kpis-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);