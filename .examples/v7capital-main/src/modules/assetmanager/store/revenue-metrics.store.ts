'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type RevenueMetrics, 
  type CreateRevenueMetricsInput, 
  type UpdateRevenueMetricsInput 
} from '../schemas/revenue-metrics.schemas';
import {
  getRevenueMetrics,
  getRevenueMetric,
  createRevenueMetrics,
  updateRevenueMetrics,
  deleteRevenueMetrics
} from '../actions/revenue-metrics.actions';

/**
 * Revenue Metrics store state interface
 */
export interface RevenueMetricsState {
  // State
  revenueMetrics: RevenueMetrics[];
  selectedRevenueMetric: RevenueMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRevenueMetrics: (companyId?: number) => Promise<boolean>;
  fetchRevenueMetric: (id: number) => Promise<boolean>;
  createRevenueMetric: (data: CreateRevenueMetricsInput) => Promise<boolean>;
  updateRevenueMetric: (id: number, data: UpdateRevenueMetricsInput) => Promise<boolean>;
  deleteRevenueMetric: (id: number) => Promise<boolean>;
  setSelectedRevenueMetric: (revenueMetric: RevenueMetrics | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getRevenueMetricsByCompany: (companyId: number) => RevenueMetrics[];
}

/**
 * Create revenue metrics store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useRevenueMetricsStore = create<RevenueMetricsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        revenueMetrics: [],
        selectedRevenueMetric: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch revenue metrics (optionally filtered by company)
         */
        fetchRevenueMetrics: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRevenueMetrics(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.revenueMetrics = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch revenue metrics'
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
         * Fetch a single revenue metric by ID
         */
        fetchRevenueMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getRevenueMetric(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedRevenueMetric = response.data!;
                
                // Update in the list if it exists
                const index = state.revenueMetrics.findIndex(rm => rm.id === id);
                if (index !== -1) {
                  state.revenueMetrics[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch revenue metric'
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
         * Create a new revenue metric
         */
        createRevenueMetric: async (data: CreateRevenueMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createRevenueMetrics(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.revenueMetrics.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create revenue metric'
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
         * Update an existing revenue metric
         */
        updateRevenueMetric: async (id: number, data: UpdateRevenueMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateRevenueMetrics(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.revenueMetrics.findIndex(rm => rm.id === id);
                if (index !== -1) {
                  state.revenueMetrics[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedRevenueMetric?.id === id) {
                  state.selectedRevenueMetric = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update revenue metric'
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
         * Delete a revenue metric
         */
        deleteRevenueMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteRevenueMetrics(id);
            
            if (response.success) {
              set((state) => {
                state.revenueMetrics = state.revenueMetrics.filter(rm => rm.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedRevenueMetric?.id === id) {
                  state.selectedRevenueMetric = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete revenue metric'
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
         * Set the selected revenue metric
         */
        setSelectedRevenueMetric: (revenueMetric: RevenueMetrics | null) => {
          set({ selectedRevenueMetric: revenueMetric });
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
            revenueMetrics: [], 
            selectedRevenueMetric: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getRevenueMetricsByCompany: (companyId: number) => {
          return get().revenueMetrics.filter(rm => rm.companyId === companyId);
        }
      })),
      {
        name: 'revenue-metrics-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);