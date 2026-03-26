'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UnitOfMeasure,
  CreateUnitOfMeasure,
  UpdateUnitOfMeasure,
} from '@/modules/nexotype/schemas/standardization/unit-of-measure.schemas';
import {
  getUnitsOfMeasure,
  getUnitOfMeasure,
  createUnitOfMeasure as apiCreateUnitOfMeasure,
  updateUnitOfMeasure as apiUpdateUnitOfMeasure,
  deleteUnitOfMeasure as apiDeleteUnitOfMeasure,
  ListUnitsOfMeasureParams,
} from '@/modules/nexotype/service/standardization/unit-of-measure.service';

/**
 * UnitOfMeasure store state interface
 */
export interface UnitOfMeasureState {
  // State
  unitsOfMeasure: UnitOfMeasure[];
  activeUnitOfMeasureId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUnitsOfMeasure: (params?: ListUnitsOfMeasureParams) => Promise<boolean>;
  fetchUnitOfMeasure: (id: number) => Promise<UnitOfMeasure | null>;
  createUnitOfMeasure: (data: CreateUnitOfMeasure) => Promise<boolean>;
  updateUnitOfMeasure: (id: number, data: UpdateUnitOfMeasure) => Promise<boolean>;
  deleteUnitOfMeasure: (id: number) => Promise<boolean>;
  setActiveUnitOfMeasure: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create unit of measure store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useUnitOfMeasureStore = create<UnitOfMeasureState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        unitsOfMeasure: [],
        activeUnitOfMeasureId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUnitsOfMeasure();

            if (response.success && response.data) {
              set((state) => {
                state.unitsOfMeasure = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize unit of measures',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize unit of measures',
            });
          }
        },

        fetchUnitsOfMeasure: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUnitsOfMeasure(params);

            if (response.success && response.data) {
              set((state) => {
                state.unitsOfMeasure = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch unit of measures',
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

        fetchUnitOfMeasure: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUnitOfMeasure(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch unit of measure with ID ${id}`,
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

        createUnitOfMeasure: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateUnitOfMeasure(data);

            if (response.success && response.data) {
              await get().fetchUnitsOfMeasure();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create unit of measure',
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

        updateUnitOfMeasure: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateUnitOfMeasure(id, data);

            if (response.success && response.data) {
              await get().fetchUnitsOfMeasure();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update unit of measure with ID ${id}`,
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

        deleteUnitOfMeasure: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteUnitOfMeasure(id);

            if (response.success) {
              await get().fetchUnitsOfMeasure();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete unit of measure with ID ${id}`,
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

        setActiveUnitOfMeasure: (id) => {
          set((state) => {
            state.activeUnitOfMeasureId = id;
          });
        },

        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set({
            unitsOfMeasure: [],
            activeUnitOfMeasureId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-unit-of-measure-storage',
        partialize: (state) => ({
          activeUnitOfMeasureId: state.activeUnitOfMeasureId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get unit of measure by ID from store
 * @param id Unit of measure ID
 * @returns The unit of measure or undefined if not found
 */
export const getUnitOfMeasureById = (id: number): UnitOfMeasure | undefined => {
  const { unitsOfMeasure } = useUnitOfMeasureStore.getState();
  return unitsOfMeasure.find((uom) => uom.id === id);
};

/**
 * Get active unit of measure from store
 * @returns The active unit of measure or undefined if not set
 */
export const getActiveUnitOfMeasure = (): UnitOfMeasure | undefined => {
  const { unitsOfMeasure, activeUnitOfMeasureId } = useUnitOfMeasureStore.getState();
  return unitsOfMeasure.find((uom) => uom.id === activeUnitOfMeasureId);
};
