'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssetOwnership,
  CreateAssetOwnership,
  UpdateAssetOwnership,
} from '@/modules/nexotype/schemas/commercial/asset-ownership.schemas';
import {
  getAssetOwnerships,
  getAssetOwnership,
  createAssetOwnership as apiCreateAssetOwnership,
  updateAssetOwnership as apiUpdateAssetOwnership,
  deleteAssetOwnership as apiDeleteAssetOwnership,
  ListAssetOwnershipsParams,
} from '@/modules/nexotype/service/commercial/asset-ownership.service';

/**
 * AssetOwnership store state interface
 */
export interface AssetOwnershipState {
  // State
  assetOwnerships: AssetOwnership[];
  activeAssetOwnershipId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssetOwnerships: (params?: ListAssetOwnershipsParams) => Promise<boolean>;
  fetchAssetOwnership: (id: number) => Promise<AssetOwnership | null>;
  createAssetOwnership: (data: CreateAssetOwnership) => Promise<boolean>;
  updateAssetOwnership: (id: number, data: UpdateAssetOwnership) => Promise<boolean>;
  deleteAssetOwnership: (id: number) => Promise<boolean>;
  setActiveAssetOwnership: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create asset ownership store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssetOwnershipStore = create<AssetOwnershipState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        assetOwnerships: [],
        activeAssetOwnershipId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize asset ownerships state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetOwnerships();

            if (response.success && response.data) {
              set((state) => {
                state.assetOwnerships = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize asset ownerships',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize asset ownerships',
            });
          }
        },

        /**
         * Fetch all asset ownerships with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchAssetOwnerships: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetOwnerships(params);

            if (response.success && response.data) {
              set((state) => {
                state.assetOwnerships = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch asset ownerships',
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
         * Fetch a specific asset ownership by ID
         * @param id AssetOwnership ID
         * @returns Promise with asset ownership or null
         */
        fetchAssetOwnership: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetOwnership(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch asset ownership with ID ${id}`,
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
         * Create a new asset ownership
         * @param data AssetOwnership creation data
         * @returns Success status
         */
        createAssetOwnership: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateAssetOwnership(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchAssetOwnerships();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create asset ownership',
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
         * Update an existing asset ownership
         * @param id AssetOwnership ID
         * @param data AssetOwnership update data
         * @returns Success status
         */
        updateAssetOwnership: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateAssetOwnership(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchAssetOwnerships();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update asset ownership with ID ${id}`,
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
         * Delete a asset ownership
         * @param id AssetOwnership ID
         * @returns Success status
         */
        deleteAssetOwnership: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteAssetOwnership(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchAssetOwnerships();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete asset ownership with ID ${id}`,
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
         * Set active asset ownership
         * @param id ID of the active asset ownership or null
         */
        setActiveAssetOwnership: (id) => {
          set((state) => {
            state.activeAssetOwnershipId = id;
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
            assetOwnerships: [],
            activeAssetOwnershipId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-asset-ownership-storage',
        partialize: (state) => ({
          activeAssetOwnershipId: state.activeAssetOwnershipId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get asset ownership by ID from store
 * @param id AssetOwnership ID
 * @returns The asset ownership or undefined if not found
 */
export const getAssetOwnershipById = (id: number): AssetOwnership | undefined => {
  const { assetOwnerships } = useAssetOwnershipStore.getState();
  return assetOwnerships.find((ao) => ao.id === id);
};

/**
 * Get active asset ownership from store
 * @returns The active asset ownership or undefined if not set
 */
export const getActiveAssetOwnership = (): AssetOwnership | undefined => {
  const { assetOwnerships, activeAssetOwnershipId } = useAssetOwnershipStore.getState();
  return assetOwnerships.find((ao) => ao.id === activeAssetOwnershipId);
};
