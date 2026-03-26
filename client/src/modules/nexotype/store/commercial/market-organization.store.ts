'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  MarketOrganization,
  CreateMarketOrganization,
  UpdateMarketOrganization,
} from '@/modules/nexotype/schemas/commercial/market-organization.schemas';
import {
  getMarketOrganizations,
  getMarketOrganization,
  createMarketOrganization as apiCreateMarketOrganization,
  updateMarketOrganization as apiUpdateMarketOrganization,
  deleteMarketOrganization as apiDeleteMarketOrganization,
  ListMarketOrganizationsParams,
} from '@/modules/nexotype/service/commercial/market-organization.service';

/**
 * Market organization store state interface
 */
export interface MarketOrganizationState {
  // State
  marketOrganizations: MarketOrganization[];
  activeMarketOrganizationId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchMarketOrganizations: (params?: ListMarketOrganizationsParams) => Promise<boolean>;
  fetchMarketOrganization: (id: number) => Promise<MarketOrganization | null>;
  createMarketOrganization: (data: CreateMarketOrganization) => Promise<boolean>;
  updateMarketOrganization: (id: number, data: UpdateMarketOrganization) => Promise<boolean>;
  deleteMarketOrganization: (id: number) => Promise<boolean>;
  setActiveMarketOrganization: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create market organization store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useMarketOrganizationStore = create<MarketOrganizationState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      marketOrganizations: [],
      activeMarketOrganizationId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize market organizations state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getMarketOrganizations();

          if (response.success && response.data) {
            set((state) => {
              state.marketOrganizations = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize market organizations',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize market organizations',
          });
        }
      },

      /**
       * Fetch all market organizations with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchMarketOrganizations: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getMarketOrganizations(params);

          if (response.success && response.data) {
            set((state) => {
              state.marketOrganizations = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch market organizations',
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Fetch a specific market organization by ID
       * @param id Market organization ID
       * @returns Promise with market organization or null
       */
      fetchMarketOrganization: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getMarketOrganization(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch market organization with ID ${id}`,
          });
          return null;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return null;
        }
      },

      /**
       * Create a new market organization
       * @param data Market organization creation data
       * @returns Success status
       */
      createMarketOrganization: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateMarketOrganization(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchMarketOrganizations();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create market organization',
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Update an existing market organization
       * @param id Market organization ID
       * @param data Market organization update data
       * @returns Success status
       */
      updateMarketOrganization: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateMarketOrganization(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchMarketOrganizations();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update market organization with ID ${id}`,
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Delete a market organization
       * @param id Market organization ID
       * @returns Success status
       */
      deleteMarketOrganization: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteMarketOrganization(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchMarketOrganizations();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete market organization with ID ${id}`,
          });
          return false;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          return false;
        }
      },

      /**
       * Set active market organization
       * @param id ID of the active market organization or null
       */
      setActiveMarketOrganization: (id) => {
        set((state) => {
          state.activeMarketOrganizationId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset state to initial values
       */
      reset: () => {
        set({
          marketOrganizations: [],
          activeMarketOrganizationId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-market-organization-storage',
        partialize: (state) => ({
          activeMarketOrganizationId: state.activeMarketOrganizationId,
        }),
        skipHydration: true,
      }
    ),
  ),
);

/**
 * Helper function to get market organization by ID from store
 * @param id Market organization ID
 * @returns The market organization or undefined if not found
 */
export const getMarketOrganizationById = (id: number): MarketOrganization | undefined => {
  const { marketOrganizations } = useMarketOrganizationStore.getState();
  return marketOrganizations.find((org) => org.id === id);
};

/**
 * Get active market organization from store
 * @returns The active market organization or undefined if not set
 */
export const getActiveMarketOrganization = (): MarketOrganization | undefined => {
  const { marketOrganizations, activeMarketOrganizationId } = useMarketOrganizationStore.getState();
  return marketOrganizations.find((org) => org.id === activeMarketOrganizationId);
};
