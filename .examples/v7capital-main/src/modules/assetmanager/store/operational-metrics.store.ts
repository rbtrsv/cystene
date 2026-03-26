'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type OperationalMetrics, 
  type CreateOperationalMetricsInput, 
  type UpdateOperationalMetricsInput 
} from '../schemas/operational-metrics.schemas';
import {
  getOperationalMetrics,
  getOperationalMetric,
  createOperationalMetrics,
  updateOperationalMetrics,
  deleteOperationalMetrics
} from '../actions/operational-metrics.actions';

/**
 * Operational Metrics store state interface
 */
export interface OperationalMetricsState {
  // State
  operationalMetrics: OperationalMetrics[];
  selectedOperationalMetric: OperationalMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOperationalMetrics: (companyId?: number) => Promise<boolean>;
  fetchOperationalMetric: (id: number) => Promise<boolean>;
  createOperationalMetric: (data: CreateOperationalMetricsInput) => Promise<boolean>;
  updateOperationalMetric: (id: number, data: UpdateOperationalMetricsInput) => Promise<boolean>;
  deleteOperationalMetric: (id: number) => Promise<boolean>;
  setSelectedOperationalMetric: (operationalMetric: OperationalMetrics | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getOperationalMetricsByCompany: (companyId: number) => OperationalMetrics[];
}

/**
 * Create operational metrics store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOperationalMetricsStore = create<OperationalMetricsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        operationalMetrics: [],
        selectedOperationalMetric: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch operational metrics (optionally filtered by company)
         */
        fetchOperationalMetrics: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getOperationalMetrics(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.operationalMetrics = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch operational metrics'
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
         * Fetch a single operational metric by ID
         */
        fetchOperationalMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getOperationalMetric(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedOperationalMetric = response.data!;
                
                // Update in the list if it exists
                const index = state.operationalMetrics.findIndex(om => om.id === id);
                if (index !== -1) {
                  state.operationalMetrics[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch operational metric'
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
         * Create a new operational metric
         */
        createOperationalMetric: async (data: CreateOperationalMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createOperationalMetrics(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.operationalMetrics.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create operational metric'
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
         * Update an existing operational metric
         */
        updateOperationalMetric: async (id: number, data: UpdateOperationalMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateOperationalMetrics(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.operationalMetrics.findIndex(om => om.id === id);
                if (index !== -1) {
                  state.operationalMetrics[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedOperationalMetric?.id === id) {
                  state.selectedOperationalMetric = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update operational metric'
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
         * Delete an operational metric
         */
        deleteOperationalMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteOperationalMetrics(id);
            
            if (response.success) {
              set((state) => {
                state.operationalMetrics = state.operationalMetrics.filter(om => om.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedOperationalMetric?.id === id) {
                  state.selectedOperationalMetric = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete operational metric'
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
         * Set the selected operational metric
         */
        setSelectedOperationalMetric: (operationalMetric: OperationalMetrics | null) => {
          set({ selectedOperationalMetric: operationalMetric });
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
            operationalMetrics: [], 
            selectedOperationalMetric: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getOperationalMetricsByCompany: (companyId: number) => {
          return get().operationalMetrics.filter(om => om.companyId === companyId);
        }
      })),
      {
        name: 'operational-metrics-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);