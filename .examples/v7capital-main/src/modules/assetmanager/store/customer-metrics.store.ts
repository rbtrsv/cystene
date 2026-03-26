'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type CustomerMetrics, 
  type CreateCustomerMetricsInput, 
  type UpdateCustomerMetricsInput 
} from '../schemas/customer-metrics.schemas';
import {
  getCustomerMetrics,
  getCustomerMetric,
  createCustomerMetrics,
  updateCustomerMetrics,
  deleteCustomerMetrics
} from '../actions/customer-metrics.actions';

/**
 * Customer Metrics store state interface
 */
export interface CustomerMetricsState {
  // State
  customerMetrics: CustomerMetrics[];
  selectedCustomerMetric: CustomerMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomerMetrics: (companyId?: number) => Promise<boolean>;
  fetchCustomerMetric: (id: number) => Promise<boolean>;
  createCustomerMetric: (data: CreateCustomerMetricsInput) => Promise<boolean>;
  updateCustomerMetric: (id: number, data: UpdateCustomerMetricsInput) => Promise<boolean>;
  deleteCustomerMetric: (id: number) => Promise<boolean>;
  setSelectedCustomerMetric: (customerMetric: CustomerMetrics | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getCustomerMetricsByCompany: (companyId: number) => CustomerMetrics[];
}

/**
 * Create customer metrics store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useCustomerMetricsStore = create<CustomerMetricsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        customerMetrics: [],
        selectedCustomerMetric: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch customer metrics (optionally filtered by company)
         */
        fetchCustomerMetrics: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getCustomerMetrics(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.customerMetrics = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch customer metrics'
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
         * Fetch a single customer metric by ID
         */
        fetchCustomerMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getCustomerMetric(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedCustomerMetric = response.data!;
                
                // Update in the list if it exists
                const index = state.customerMetrics.findIndex(cm => cm.id === id);
                if (index !== -1) {
                  state.customerMetrics[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch customer metric'
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
         * Create a new customer metric
         */
        createCustomerMetric: async (data: CreateCustomerMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createCustomerMetrics(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.customerMetrics.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create customer metric'
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
         * Update an existing customer metric
         */
        updateCustomerMetric: async (id: number, data: UpdateCustomerMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateCustomerMetrics(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.customerMetrics.findIndex(cm => cm.id === id);
                if (index !== -1) {
                  state.customerMetrics[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedCustomerMetric?.id === id) {
                  state.selectedCustomerMetric = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update customer metric'
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
         * Delete a customer metric
         */
        deleteCustomerMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteCustomerMetrics(id);
            
            if (response.success) {
              set((state) => {
                state.customerMetrics = state.customerMetrics.filter(cm => cm.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedCustomerMetric?.id === id) {
                  state.selectedCustomerMetric = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete customer metric'
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
         * Set the selected customer metric
         */
        setSelectedCustomerMetric: (customerMetric: CustomerMetrics | null) => {
          set({ selectedCustomerMetric: customerMetric });
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
            customerMetrics: [], 
            selectedCustomerMetric: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getCustomerMetricsByCompany: (companyId: number) => {
          return get().customerMetrics.filter(cm => cm.companyId === companyId);
        }
      })),
      {
        name: 'customer-metrics-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);