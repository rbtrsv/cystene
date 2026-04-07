'use client';

/**
 * Asset Store
 *
 * Zustand store for Asset model.
 * Read-only — no create/update/delete. Scanner discovers assets, user views them.
 * Uses immer middleware for easier state updates.
 * Uses devtools middleware for Redux DevTools integration.
 *
 * Backend: /server/apps/cybersecurity/subrouters/discovery_subrouters/asset_subrouter.py
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Asset,
} from '../../schemas/discovery/assets.schemas';
import {
  getAssets,
  getAsset,
  ListAssetsParams,
} from '../../service/discovery/assets.service';

/**
 * Asset store state interface
 */
export interface AssetState {
  // State
  assets: Asset[];
  activeAssetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssets: (params?: ListAssetsParams) => Promise<boolean>;
  fetchAsset: (id: number) => Promise<Asset | null>;
  setActiveAsset: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create asset store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssetStore = create<AssetState>()(
  devtools(
    persist(
      immer((set) => ({
      // Initial state
      assets: [],
      activeAssetId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize assets state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getAssets();

          if (response.success && response.data) {
            set((state) => {
              state.assets = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize assets'
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize assets'
          });
        }
      },

      /**
       * Fetch all assets with optional filters
       * @param params Optional query parameters for filtering (asset_type, scan_job_id)
       * @returns Success status
       */
      fetchAssets: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getAssets(params);

          if (response.success && response.data) {
            set((state) => {
              state.assets = response.data || [];
              state.isLoading = false;
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch assets'
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
       * Fetch a specific asset by ID
       * @param id Asset ID
       * @returns Promise with asset or null
       */
      fetchAsset: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getAsset(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          } else {
            set({
              isLoading: false,
              error: response.error || `Failed to fetch asset with ID ${id}`
            });
            return null;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
          return null;
        }
      },

      /**
       * Set active asset
       * @param id ID of the active asset or null
       */
      setActiveAsset: (id) => {
        set((state) => {
          state.activeAssetId = id;
        });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset asset state to initial values
       */
      reset: () => {
        set({
          assets: [],
          activeAssetId: null,
          isLoading: false,
          error: null,
          isInitialized: false
        });
      }
    })),
      {
        name: 'cystene-asset-storage',
        partialize: (state) => ({
          activeAssetId: state.activeAssetId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get asset by ID from store
 * @param id Asset ID
 * @returns The asset or undefined if not found
 */
export const getAssetById = (id: number): Asset | undefined => {
  const { assets } = useAssetStore.getState();
  return assets.find((item) => item.id === id);
};

/**
 * Get active asset from store
 * @returns The active asset or undefined if not set
 */
export const getActiveAsset = (): Asset | undefined => {
  const { assets, activeAssetId } = useAssetStore.getState();
  return assets.find((item) => item.id === activeAssetId);
};
