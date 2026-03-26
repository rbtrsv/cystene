'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type TeamMetrics, 
  type CreateTeamMetricsInput, 
  type UpdateTeamMetricsInput 
} from '../schemas/team-metrics.schemas';
import {
  getTeamMetrics,
  getTeamMetric,
  createTeamMetrics,
  updateTeamMetrics,
  deleteTeamMetrics
} from '../actions/team-metrics.actions';

/**
 * Team Metrics store state interface
 */
export interface TeamMetricsState {
  // State
  teamMetrics: TeamMetrics[];
  selectedTeamMetric: TeamMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTeamMetrics: (companyId?: number) => Promise<boolean>;
  fetchTeamMetric: (id: number) => Promise<boolean>;
  createTeamMetric: (data: CreateTeamMetricsInput) => Promise<boolean>;
  updateTeamMetric: (id: number, data: UpdateTeamMetricsInput) => Promise<boolean>;
  deleteTeamMetric: (id: number) => Promise<boolean>;
  setSelectedTeamMetric: (teamMetric: TeamMetrics | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  getTeamMetricsByCompany: (companyId: number) => TeamMetrics[];
}

/**
 * Create team metrics store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTeamMetricsStore = create<TeamMetricsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        teamMetrics: [],
        selectedTeamMetric: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch team metrics (optionally filtered by company)
         */
        fetchTeamMetrics: async (companyId?: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getTeamMetrics(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.teamMetrics = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch team metrics'
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
         * Fetch a single team metric by ID
         */
        fetchTeamMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getTeamMetric(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedTeamMetric = response.data!;
                
                // Update in the list if it exists
                const index = state.teamMetrics.findIndex(tm => tm.id === id);
                if (index !== -1) {
                  state.teamMetrics[index] = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch team metric'
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
         * Create a new team metric
         */
        createTeamMetric: async (data: CreateTeamMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createTeamMetrics(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.teamMetrics.push(response.data!);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create team metric'
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
         * Update an existing team metric
         */
        updateTeamMetric: async (id: number, data: UpdateTeamMetricsInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateTeamMetrics(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                // Update in the list
                const index = state.teamMetrics.findIndex(tm => tm.id === id);
                if (index !== -1) {
                  state.teamMetrics[index] = response.data!;
                }
                
                // Update selected if it's the same
                if (state.selectedTeamMetric?.id === id) {
                  state.selectedTeamMetric = response.data!;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update team metric'
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
         * Delete a team metric
         */
        deleteTeamMetric: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteTeamMetrics(id);
            
            if (response.success) {
              set((state) => {
                state.teamMetrics = state.teamMetrics.filter(tm => tm.id !== id);
                
                // Clear selected if it's the same
                if (state.selectedTeamMetric?.id === id) {
                  state.selectedTeamMetric = null;
                }
                
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete team metric'
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
         * Set the selected team metric
         */
        setSelectedTeamMetric: (teamMetric: TeamMetrics | null) => {
          set({ selectedTeamMetric: teamMetric });
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
            teamMetrics: [], 
            selectedTeamMetric: null, 
            isLoading: false, 
            error: null 
          });
        },
        
        // Helper methods
        getTeamMetricsByCompany: (companyId: number) => {
          return get().teamMetrics.filter(tm => tm.companyId === companyId);
        }
      })),
      {
        name: 'team-metrics-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    )
  )
);