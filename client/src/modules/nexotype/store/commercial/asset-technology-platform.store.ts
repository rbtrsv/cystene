'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AssetTechnologyPlatform,
  CreateAssetTechnologyPlatform,
  UpdateAssetTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/asset-technology-platform.schemas';
import {
  getAssetTechnologyPlatforms,
  getAssetTechnologyPlatform,
  createAssetTechnologyPlatform as apiCreateAssetTechnologyPlatform,
  updateAssetTechnologyPlatform as apiUpdateAssetTechnologyPlatform,
  deleteAssetTechnologyPlatform as apiDeleteAssetTechnologyPlatform,
  ListAssetTechnologyPlatformsParams,
} from '@/modules/nexotype/service/commercial/asset-technology-platform.service';

/**
 * AssetTechnologyPlatform store state interface
 */
export interface AssetTechnologyPlatformState {
  // State
  assetTechnologyPlatforms: AssetTechnologyPlatform[];
  activeAssetTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchAssetTechnologyPlatforms: (params?: ListAssetTechnologyPlatformsParams) => Promise<boolean>;
  fetchAssetTechnologyPlatform: (id: number) => Promise<AssetTechnologyPlatform | null>;
  createAssetTechnologyPlatform: (data: CreateAssetTechnologyPlatform) => Promise<boolean>;
  updateAssetTechnologyPlatform: (id: number, data: UpdateAssetTechnologyPlatform) => Promise<boolean>;
  deleteAssetTechnologyPlatform: (id: number) => Promise<boolean>;
  setActiveAssetTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create asset technology platform store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAssetTechnologyPlatformStore = create<AssetTechnologyPlatformState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        assetTechnologyPlatforms: [],
        activeAssetTechnologyPlatformId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize asset technology platforms state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetTechnologyPlatforms();

            if (response.success && response.data) {
              set((state) => {
                state.assetTechnologyPlatforms = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize asset technology platforms',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize asset technology platforms',
            });
          }
        },

        /**
         * Fetch all asset technology platforms with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchAssetTechnologyPlatforms: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetTechnologyPlatforms(params);

            if (response.success && response.data) {
              set((state) => {
                state.assetTechnologyPlatforms = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch asset technology platforms',
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
         * Fetch a specific asset technology platform by ID
         * @param id AssetTechnologyPlatform ID
         * @returns Promise with asset technology platform or null
         */
        fetchAssetTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getAssetTechnologyPlatform(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch asset technology platform with ID ${id}`,
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
         * Create a new asset technology platform
         * @param data AssetTechnologyPlatform creation data
         * @returns Success status
         */
        createAssetTechnologyPlatform: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateAssetTechnologyPlatform(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchAssetTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create asset technology platform',
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
         * Update an existing asset technology platform
         * @param id AssetTechnologyPlatform ID
         * @param data AssetTechnologyPlatform update data
         * @returns Success status
         */
        updateAssetTechnologyPlatform: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateAssetTechnologyPlatform(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchAssetTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update asset technology platform with ID ${id}`,
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
         * Delete a asset technology platform
         * @param id AssetTechnologyPlatform ID
         * @returns Success status
         */
        deleteAssetTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteAssetTechnologyPlatform(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchAssetTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete asset technology platform with ID ${id}`,
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
         * Set active asset technology platform
         * @param id ID of the active asset technology platform or null
         */
        setActiveAssetTechnologyPlatform: (id) => {
          set((state) => {
            state.activeAssetTechnologyPlatformId = id;
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
            assetTechnologyPlatforms: [],
            activeAssetTechnologyPlatformId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-asset-technology-platform-storage',
        partialize: (state) => ({
          activeAssetTechnologyPlatformId: state.activeAssetTechnologyPlatformId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get asset technology platform by ID from store
 * @param id AssetTechnologyPlatform ID
 * @returns The asset technology platform or undefined if not found
 */
export const getAssetTechnologyPlatformById = (id: number): AssetTechnologyPlatform | undefined => {
  const { assetTechnologyPlatforms } = useAssetTechnologyPlatformStore.getState();
  return assetTechnologyPlatforms.find((atp) => atp.id === id);
};

/**
 * Get active asset technology platform from store
 * @returns The active asset technology platform or undefined if not set
 */
export const getActiveAssetTechnologyPlatform = (): AssetTechnologyPlatform | undefined => {
  const { assetTechnologyPlatforms, activeAssetTechnologyPlatformId } = useAssetTechnologyPlatformStore.getState();
  return assetTechnologyPlatforms.find((atp) => atp.id === activeAssetTechnologyPlatformId);
};
