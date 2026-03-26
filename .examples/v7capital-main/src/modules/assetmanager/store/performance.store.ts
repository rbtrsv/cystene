'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  getFundPerformance, 
  getStakeholdersPerformance,
  getCompanyPerformance,
  getCompaniesPerformance 
} from '../actions/performance.actions';

/**
 * Performance store state interface
 */
export interface PerformanceState {
  // State
  fundPerformance: any | null;
  stakeholderPerformances: any[];
  companyPerformance: any | null;
  companyPerformances: any[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFundPerformance: (fundId: number, roundId?: number, endDate?: Date) => Promise<boolean>;
  fetchStakeholdersPerformance: (fundId: number, roundId?: number, endDate?: Date) => Promise<boolean>;
  fetchCompanyPerformance: (companyId: number, endDate?: Date) => Promise<boolean>;
  fetchCompaniesPerformance: (fundId?: number, endDate?: Date) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
  
  // Helper methods
  hasPerformanceData: () => boolean;
  getFundStakeholders: (fundId: number) => any[];
  getCompanyById: (companyId: number) => any | undefined;
}

/**
 * Create performance store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const usePerformanceStore = create<PerformanceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        fundPerformance: null,
        stakeholderPerformances: [],
        companyPerformance: null,
        companyPerformances: [],
        isLoading: false,
        error: null,

        // Fetch fund performance
        fetchFundPerformance: async (fundId: number, roundId?: number, endDate?: Date) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getFundPerformance(fundId, roundId, endDate);

            if (response.success && response.data !== undefined && response.data !== null) {
              set((state) => {
                state.fundPerformance = response.data;
                state.isLoading = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = response.error || 'Failed to fetch fund performance';
                state.isLoading = false;
              });
              return false;
            }
          } catch (error: any) {
            set((state) => {
              state.error = error.message || 'Failed to fetch fund performance';
              state.isLoading = false;
            });
            return false;
          }
        },

        // Fetch stakeholders performance
        fetchStakeholdersPerformance: async (fundId: number, roundId?: number, endDate?: Date) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getStakeholdersPerformance(fundId, roundId, endDate);

            if (response.success && response.data !== undefined && response.data !== null) {
              set((state) => {
                state.stakeholderPerformances = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = response.error || 'Failed to fetch stakeholders performance';
                state.isLoading = false;
              });
              return false;
            }
          } catch (error: any) {
            set((state) => {
              state.error = error.message || 'Failed to fetch stakeholders performance';
              state.isLoading = false;
            });
            return false;
          }
        },

        // Fetch company performance
        fetchCompanyPerformance: async (companyId: number, endDate?: Date) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getCompanyPerformance(companyId, endDate);

            if (response.success && response.data !== undefined && response.data !== null) {
              set((state) => {
                state.companyPerformance = response.data;
                state.isLoading = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = response.error || 'Failed to fetch company performance';
                state.isLoading = false;
              });
              return false;
            }
          } catch (error: any) {
            set((state) => {
              state.error = error.message || 'Failed to fetch company performance';
              state.isLoading = false;
            });
            return false;
          }
        },

        // Fetch companies performance
        fetchCompaniesPerformance: async (fundId?: number, endDate?: Date) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await getCompaniesPerformance(fundId, endDate);

            if (response.success && response.data !== undefined && response.data !== null) {
              set((state) => {
                state.companyPerformances = response.data || [];
                state.isLoading = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = response.error || 'Failed to fetch companies performance';
                state.isLoading = false;
              });
              return false;
            }
          } catch (error: any) {
            set((state) => {
              state.error = error.message || 'Failed to fetch companies performance';
              state.isLoading = false;
            });
            return false;
          }
        },

        // Clear error
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Reset store
        reset: () => {
          set((state) => {
            state.fundPerformance = null;
            state.stakeholderPerformances = [];
            state.companyPerformance = null;
            state.companyPerformances = [];
            state.isLoading = false;
            state.error = null;
          });
        },

        // Helper methods
        hasPerformanceData: () => {
          const state = get();
          return state.fundPerformance !== null || 
                 state.stakeholderPerformances.length > 0 ||
                 state.companyPerformance !== null ||
                 state.companyPerformances.length > 0;
        },

        getFundStakeholders: (fundId: number) => {
          const state = get();
          return state.stakeholderPerformances.filter((s: any) => s.fundId === fundId);
        },

        getCompanyById: (companyId: number) => {
          const state = get();
          return state.companyPerformances.find((c: any) => c.companyId === companyId);
        }
      })),
      {
        name: 'v7capital-performance-storage',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    ),
    {
      name: 'performance-store'
    }
  )
);