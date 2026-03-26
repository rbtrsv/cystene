'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Variant,
  CreateVariant,
  UpdateVariant,
} from '@/modules/nexotype/schemas/omics/variant.schemas';
import {
  getVariants,
  getVariant,
  createVariant as apiCreateVariant,
  updateVariant as apiUpdateVariant,
  deleteVariant as apiDeleteVariant,
  ListVariantsParams,
} from '@/modules/nexotype/service/omics/variant.service';

/**
 * Variant store state interface
 */
export interface VariantState {
  // State
  variants: Variant[];
  activeVariantId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchVariants: (params?: ListVariantsParams) => Promise<boolean>;
  fetchVariant: (id: number) => Promise<Variant | null>;
  createVariant: (data: CreateVariant) => Promise<boolean>;
  updateVariant: (id: number, data: UpdateVariant) => Promise<boolean>;
  deleteVariant: (id: number) => Promise<boolean>;
  setActiveVariant: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create variant store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useVariantStore = create<VariantState>()(
  devtools(
    persist(
      immer((set, get) => ({
      // Initial state
      variants: [],
      activeVariantId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      /**
       * Initialize variants state
       */
      initialize: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await getVariants();

          if (response.success && response.data) {
            set((state) => {
              state.variants = response.data || [];
              state.isInitialized = true;
              state.isLoading = false;
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
              error: response.error || 'Failed to initialize variants',
            });
          }
        } catch (error) {
          set({
            isInitialized: true,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize variants',
          });
        }
      },

      /**
       * Fetch all variants with optional pagination
       * @param params Optional query parameters for pagination
       * @returns Success status
       */
      fetchVariants: async (params) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getVariants(params);

          if (response.success && response.data) {
            set((state) => {
              state.variants = response.data || [];
              state.isLoading = false;
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to fetch variants',
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
       * Fetch a specific variant by ID
       * @param id Variant ID
       * @returns Promise with variant or null
       */
      fetchVariant: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await getVariant(id);

          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to fetch variant with ID ${id}`,
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
       * Create a new variant
       * @param data Variant creation data
       * @returns Success status
       */
      createVariant: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiCreateVariant(data);

          if (response.success && response.data) {
            // After creating, refresh list
            await get().fetchVariants();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || 'Failed to create variant',
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
       * Update an existing variant
       * @param id Variant ID
       * @param data Variant update data
       * @returns Success status
       */
      updateVariant: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiUpdateVariant(id, data);

          if (response.success && response.data) {
            // After updating, refresh list
            await get().fetchVariants();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to update variant with ID ${id}`,
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
       * Delete a variant
       * @param id Variant ID
       * @returns Success status
       */
      deleteVariant: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiDeleteVariant(id);

          if (response.success) {
            // After deleting, refresh list
            await get().fetchVariants();

            set({ isLoading: false });
            return true;
          }

          set({
            isLoading: false,
            error: response.error || `Failed to delete variant with ID ${id}`,
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
       * Set active variant
       * @param id ID of the active variant or null
       */
      setActiveVariant: (id) => {
        set((state) => {
          state.activeVariantId = id;
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
          variants: [],
          activeVariantId: null,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    })),
      {
        name: 'nexotype-variant-storage',
        partialize: (state) => ({
          activeVariantId: state.activeVariantId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get variant by ID from store
 * @param id Variant ID
 * @returns The variant or undefined if not found
 */
export const getVariantById = (id: number): Variant | undefined => {
  const { variants } = useVariantStore.getState();
  return variants.find((variant) => variant.id === id);
};

/**
 * Get active variant from store
 * @returns The active variant or undefined if not set
 */
export const getActiveVariant = (): Variant | undefined => {
  const { variants, activeVariantId } = useVariantStore.getState();
  return variants.find((variant) => variant.id === activeVariantId);
};
