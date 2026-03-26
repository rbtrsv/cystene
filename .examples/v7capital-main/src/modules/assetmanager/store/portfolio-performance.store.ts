'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type PortfolioPerformance, 
  type CreatePortfolioPerformanceInput, 
  type UpdatePortfolioPerformanceInput 
} from '../schemas/portfolio-performance.schemas';
import {
  getPortfolioPerformances,
  getPortfolioPerformance,
  createPortfolioPerformance,
  updatePortfolioPerformance,
  deletePortfolioPerformance
} from '../actions/portfolio-performance.actions';

/**
 * Portfolio Performance store state interface
 */
export interface PortfolioPerformanceState {
  // State
  portfolioPerformances: PortfolioPerformance[];
  selectedPortfolioPerformance: PortfolioPerformance | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPortfolioPerformances: () => Promise<boolean>;
  fetchPortfolioPerformance: (id: number) => Promise<boolean>;
  createPortfolioPerformance: (data: CreatePortfolioPerformanceInput) => Promise<boolean>;
  updatePortfolioPerformance: (id: number, data: UpdatePortfolioPerformanceInput) => Promise<boolean>;
  deletePortfolioPerformance: (id: number) => Promise<boolean>;
  setSelectedPortfolioPerformance: (portfolioPerformance: PortfolioPerformance | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create portfolio performance store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePortfolioPerformanceStore = create<PortfolioPerformanceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        portfolioPerformances: [],
        selectedPortfolioPerformance: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all portfolio performances
         */
        fetchPortfolioPerformances: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioPerformances();
            
            if (response.success && response.data) {
              set((state) => {
                state.portfolioPerformances = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio performances'
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
         * Fetch a single portfolio performance by ID
         */
        fetchPortfolioPerformance: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getPortfolioPerformance(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedPortfolioPerformance = response.data!;
                
                // Update in the list if it exists
                const index = state.portfolioPerformances.findIndex(pp => pp.id === id);
                if (index !== -1) {
                  state.portfolioPerformances[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolio performance'
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
         * Create a new portfolio performance
         */
        createPortfolioPerformance: async (data: CreatePortfolioPerformanceInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createPortfolioPerformance(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.portfolioPerformances.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create portfolio performance'
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
         * Update an existing portfolio performance
         */
        updatePortfolioPerformance: async (id: number, data: UpdatePortfolioPerformanceInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updatePortfolioPerformance(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.portfolioPerformances.findIndex(pp => pp.id === id);
                if (index !== -1) {
                  state.portfolioPerformances[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedPortfolioPerformance?.id === id) {
                  state.selectedPortfolioPerformance = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update portfolio performance'
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
         * Delete a portfolio performance
         */
        deletePortfolioPerformance: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deletePortfolioPerformance(id);
            
            if (response.success) {
              set((state) => {
                state.portfolioPerformances = state.portfolioPerformances.filter(pp => pp.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedPortfolioPerformance?.id === id) {
                  state.selectedPortfolioPerformance = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete portfolio performance'
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
         * Set the selected portfolio performance
         */
        setSelectedPortfolioPerformance: (portfolioPerformance: PortfolioPerformance | null) => {
          set({ selectedPortfolioPerformance: portfolioPerformance });
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
            portfolioPerformances: [], 
            selectedPortfolioPerformance: null, 
            isLoading: false, 
            error: null 
          });
        }
      })),
      {
        name: 'v7capital-portfolio-performance-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);