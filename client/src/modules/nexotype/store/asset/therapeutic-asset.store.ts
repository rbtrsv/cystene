'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  TherapeuticAsset,
  CreateTherapeuticAsset,
  UpdateTherapeuticAsset,
} from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import {
  getTherapeuticAssets,
  getTherapeuticAsset,
  createTherapeuticAsset as apiCreateTherapeuticAsset,
  updateTherapeuticAsset as apiUpdateTherapeuticAsset,
  deleteTherapeuticAsset as apiDeleteTherapeuticAsset,
  ListTherapeuticAssetsParams,
} from '@/modules/nexotype/service/asset/therapeutic-asset.service';

/**
 * Therapeutic asset store state interface
 */
export interface TherapeuticAssetState {
  // State
  therapeuticAssets: TherapeuticAsset[];
  activeTherapeuticAssetId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchTherapeuticAssets: (params?: ListTherapeuticAssetsParams) => Promise<boolean>;
  fetchTherapeuticAsset: (id: number) => Promise<TherapeuticAsset | null>;
  createTherapeuticAsset: (data: CreateTherapeuticAsset) => Promise<boolean>;
  updateTherapeuticAsset: (id: number, data: UpdateTherapeuticAsset) => Promise<boolean>;
  deleteTherapeuticAsset: (id: number) => Promise<boolean>;
  setActiveTherapeuticAsset: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create therapeutic asset store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useTherapeuticAssetStore = create<TherapeuticAssetState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      therapeuticAssets: [],
      activeTherapeuticAssetId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize therapeutic assets state
       */
      // Bootstrap initial list state for first-load screens.

      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTherapeuticAssets();

          if (response.success && response.data) {
            set((state) => {
              state.therapeuticAssets = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize therapeutic assets',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize therapeutic assets',
          });
        }
      },

      /**
       * Fetch all therapeutic assets with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchTherapeuticAssets: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTherapeuticAssets(params);

          if (response.success && response.data) {
            set((state) => {
              state.therapeuticAssets = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch therapeutic assets',
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
       * Fetch a specific therapeutic asset by ID
       * @param id Therapeutic asset ID
       * @returns Promise with therapeutic asset or null
       */
      fetchTherapeuticAsset: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getTherapeuticAsset(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch therapeutic asset with ID ${id}`,
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
       * Create a new therapeutic asset
       * @param data Therapeutic asset creation data
       * @returns Success status
       */
      // Create and refresh list so UI remains consistent.

      createTherapeuticAsset: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateTherapeuticAsset(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchTherapeuticAssets();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create therapeutic asset',
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
       * Update an existing therapeutic asset
       * @param id Therapeutic asset ID
       * @param data Therapeutic asset update data
       * @returns Success status
       */
      updateTherapeuticAsset: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateTherapeuticAsset(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchTherapeuticAssets();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update therapeutic asset with ID ${id}`,
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
       * Delete a therapeutic asset
       * @param id Therapeutic asset ID
       * @returns Success status
       */
      // Soft-delete and refresh list so archived rows are hidden.

      deleteTherapeuticAsset: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteTherapeuticAsset(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchTherapeuticAssets();
            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete therapeutic asset with ID ${id}`,
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
       * Set active therapeutic asset
       * @param id ID of the active therapeutic asset or null
       */
      setActiveTherapeuticAsset: (id) => {
        set((state) => {
          state.activeTherapeuticAssetId = id;
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
          therapeuticAssets: [],
          activeTherapeuticAssetId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-therapeutic-asset-storage',
        partialize: (state) => ({
          activeTherapeuticAssetId: state.activeTherapeuticAssetId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get therapeutic asset by ID from store
 * @param id Therapeutic asset ID
 * @returns The therapeutic asset or undefined if not found
 */
export const getTherapeuticAssetById = (id: number): TherapeuticAsset | undefined => {
  const { therapeuticAssets } = useTherapeuticAssetStore.getState();
  return therapeuticAssets.find((asset) => asset.id === id);
};

/**
 * Get active therapeutic asset from store
 * @returns The active therapeutic asset or undefined if not set
 */
export const getActiveTherapeuticAsset = (): TherapeuticAsset | undefined => {
  const { therapeuticAssets, activeTherapeuticAssetId } = useTherapeuticAssetStore.getState();
  return therapeuticAssets.find((asset) => asset.id === activeTherapeuticAssetId);
};
