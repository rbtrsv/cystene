'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type InvestmentPortfolio, 
  type InvestmentPortfolioWithRelations,
  type CreateInvestmentPortfolioInput,
  type UpdateInvestmentPortfolioInput
} from '../schemas/portfolio-investment.schemas';
import {
  getInvestmentPortfolios,
  getInvestmentPortfoliosWithRelations,
  getInvestmentPortfolio,
  createInvestmentPortfolio,
  updateInvestmentPortfolio,
  deleteInvestmentPortfolio,
  getInvestmentPortfoliosByCompany,
  getInvestmentPortfoliosByFund,
  getFundUnits
} from '../actions/portfolio-investment.actions';

/**
 * Investment Portfolio store state interface
 */
export interface InvestmentPortfolioState {
  // State
  portfolios: InvestmentPortfolio[];
  portfoliosWithRelations: InvestmentPortfolioWithRelations[];
  selectedPortfolio: InvestmentPortfolio | null;
  totalFundUnits: number | null;
  isLoading: boolean;
  error: string | null;

  // Portfolio actions
  fetchPortfolios: () => Promise<void>;
  fetchPortfoliosWithRelations: () => Promise<void>;
  fetchPortfolio: (id: number) => Promise<void>;
  addPortfolio: (data: CreateInvestmentPortfolioInput) => Promise<boolean>;
  editPortfolio: (id: number, data: UpdateInvestmentPortfolioInput) => Promise<boolean>;
  removePortfolio: (id: number) => Promise<boolean>;

  // Filter actions
  fetchPortfoliosByCompany: (companyId: number) => Promise<void>;
  fetchPortfoliosByFund: (fundId: number) => Promise<void>;

  // Fund units actions
  fetchFundUnits: (fundId?: number) => Promise<void>;

  // Utility actions
  setSelectedPortfolio: (portfolio: InvestmentPortfolio | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create investment portfolio store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useInvestmentPortfolioStore = create<InvestmentPortfolioState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        portfolios: [],
        portfoliosWithRelations: [],
        selectedPortfolio: null,
        totalFundUnits: null,
        isLoading: false,
        error: null,
        
        /**
         * Fetch all investment portfolios
         */
        fetchPortfolios: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getInvestmentPortfolios();
            
            if (response.success && response.data) {
              set((state) => {
                state.portfolios = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch investment portfolios'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch all investment portfolios with relations (company, fund, round details)
         */
        fetchPortfoliosWithRelations: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getInvestmentPortfoliosWithRelations();
            
            if (response.success && response.data) {
              set((state) => {
                state.portfoliosWithRelations = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch investment portfolios with relations'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch a single investment portfolio by ID
         * @param id - Portfolio ID
         */
        fetchPortfolio: async (id: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getInvestmentPortfolio(id);
            
            if (response.success && response.data) {
              set((state) => {
                state.selectedPortfolio = response.data || null;
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch investment portfolio'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Create a new investment portfolio
         * @param data - Portfolio creation data
         */
        addPortfolio: async (data: CreateInvestmentPortfolioInput): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await createInvestmentPortfolio(data);
            
            if (response.success && response.data) {
              set((state) => {
                state.portfolios.push(response.data);
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to create investment portfolio'
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
         * Update an existing investment portfolio
         * @param id - Portfolio ID
         * @param data - Portfolio update data
         */
        editPortfolio: async (id: number, data: UpdateInvestmentPortfolioInput): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await updateInvestmentPortfolio(id, data);
            
            if (response.success && response.data) {
              set((state) => {
                const index = state.portfolios.findIndex(p => p.id === id);
                if (index !== -1) {
                  state.portfolios[index] = response.data;
                }
                if (state.selectedPortfolio?.id === id) {
                  state.selectedPortfolio = response.data;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to update investment portfolio'
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
         * Delete an investment portfolio
         * @param id - Portfolio ID
         */
        removePortfolio: async (id: number): Promise<boolean> => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await deleteInvestmentPortfolio(id);
            
            if (response.success) {
              set((state) => {
                state.portfolios = state.portfolios.filter(p => p.id !== id);
                state.portfoliosWithRelations = state.portfoliosWithRelations.filter(p => p.id !== id);
                if (state.selectedPortfolio?.id === id) {
                  state.selectedPortfolio = null;
                }
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to delete investment portfolio'
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
         * Fetch investment portfolios by company ID
         * @param companyId - Company ID
         */
        fetchPortfoliosByCompany: async (companyId: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await getInvestmentPortfoliosByCompany(companyId);
            
            if (response.success && response.data) {
              set((state) => {
                state.portfolios = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch portfolios by company'
              });
            }
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        
        /**
         * Fetch investment portfolios by fund ID
         * @param fundId - Fund ID
         */
        fetchPortfoliosByFund: async (fundId: number) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getInvestmentPortfoliosByFund(fundId);

            if (response.success && response.data) {
              set((state) => {
                state.portfolios = response.data || [];
                state.isLoading = false;
              });
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch portfolios by fund'
              });
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },

        /**
         * Fetch total fund units from transactions
         * @param fundId - Optional fund ID to filter by specific fund
         */
        fetchFundUnits: async (fundId?: number) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getFundUnits(fundId);

            if (response.success && response.data !== undefined) {
              set((state) => {
                state.totalFundUnits = response.data ?? null;
                state.isLoading = false;
              });
            } else {
              set({
                isLoading: false,
                error: response.error || 'Failed to fetch fund units'
              });
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },

        /**
         * Set selected portfolio
         * @param portfolio - Portfolio to select
         */
        setSelectedPortfolio: (portfolio: InvestmentPortfolio | null) => {
          set((state) => {
            state.selectedPortfolio = portfolio;
          });
        },
        
        /**
         * Clear error state
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset store to initial state
         */
        reset: () => {
          set({
            portfolios: [],
            portfoliosWithRelations: [],
            selectedPortfolio: null,
            totalFundUnits: null,
            isLoading: false,
            error: null,
          });
        },
      })),
      {
        name: 'investment-portfolio-store',
        // Persist nothing - data is fetched fresh each time to ensure proper permission checks
        partialize: () => ({})
      }
    ),
    {
      name: 'Investment Portfolio Store',
    }
  )
);
