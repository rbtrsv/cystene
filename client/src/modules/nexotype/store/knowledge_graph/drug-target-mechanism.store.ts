'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DrugTargetMechanism,
  CreateDrugTargetMechanism,
  UpdateDrugTargetMechanism,
} from '@/modules/nexotype/schemas/knowledge_graph/drug-target-mechanism.schemas';
import {
  getDrugTargetMechanisms,
  getDrugTargetMechanism,
  createDrugTargetMechanism as apiCreateDrugTargetMechanism,
  updateDrugTargetMechanism as apiUpdateDrugTargetMechanism,
  deleteDrugTargetMechanism as apiDeleteDrugTargetMechanism,
  ListDrugTargetMechanismsParams,
} from '@/modules/nexotype/service/knowledge_graph/drug-target-mechanism.service';

/**
 * DrugTargetMechanism store state interface
 */
export interface DrugTargetMechanismState {
  // State
  drugTargetMechanisms: DrugTargetMechanism[];
  activeDrugTargetMechanismId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchDrugTargetMechanisms: (params?: ListDrugTargetMechanismsParams) => Promise<boolean>;
  fetchDrugTargetMechanism: (id: number) => Promise<DrugTargetMechanism | null>;
  createDrugTargetMechanism: (data: CreateDrugTargetMechanism) => Promise<boolean>;
  updateDrugTargetMechanism: (id: number, data: UpdateDrugTargetMechanism) => Promise<boolean>;
  deleteDrugTargetMechanism: (id: number) => Promise<boolean>;
  setActiveDrugTargetMechanism: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create drug target mechanism store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useDrugTargetMechanismStore = create<DrugTargetMechanismState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        drugTargetMechanisms: [],
        activeDrugTargetMechanismId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize drug target mechanisms state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugTargetMechanisms();

            if (response.success && response.data) {
              set((state) => {
                state.drugTargetMechanisms = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize drug target mechanisms',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize drug target mechanisms',
            });
          }
        },

        /**
         * Fetch all drug target mechanisms with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchDrugTargetMechanisms: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugTargetMechanisms(params);

            if (response.success && response.data) {
              set((state) => {
                state.drugTargetMechanisms = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch drug target mechanisms',
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
         * Fetch a specific drug target mechanism by ID
         * @param id DrugTargetMechanism ID
         * @returns Promise with drug target mechanism or null
         */
        fetchDrugTargetMechanism: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getDrugTargetMechanism(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch drug target mechanism with ID ${id}`,
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
         * Create a new drug target mechanism
         * @param data DrugTargetMechanism creation data
         * @returns Success status
         */
        createDrugTargetMechanism: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateDrugTargetMechanism(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchDrugTargetMechanisms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create drug target mechanism',
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
         * Update an existing drug target mechanism
         * @param id DrugTargetMechanism ID
         * @param data DrugTargetMechanism update data
         * @returns Success status
         */
        updateDrugTargetMechanism: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateDrugTargetMechanism(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchDrugTargetMechanisms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update drug target mechanism with ID ${id}`,
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
         * Delete a drug target mechanism
         * @param id DrugTargetMechanism ID
         * @returns Success status
         */
        deleteDrugTargetMechanism: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteDrugTargetMechanism(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchDrugTargetMechanisms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete drug target mechanism with ID ${id}`,
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
         * Set active drug target mechanism
         * @param id ID of the active drug target mechanism or null
         */
        setActiveDrugTargetMechanism: (id) => {
          set((state) => {
            state.activeDrugTargetMechanismId = id;
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
            drugTargetMechanisms: [],
            activeDrugTargetMechanismId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-drug-target-mechanism-storage',
        partialize: (state) => ({
          activeDrugTargetMechanismId: state.activeDrugTargetMechanismId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get drug target mechanism by ID from store
 * @param id DrugTargetMechanism ID
 * @returns The drug target mechanism or undefined if not found
 */
export const getDrugTargetMechanismById = (id: number): DrugTargetMechanism | undefined => {
  const { drugTargetMechanisms } = useDrugTargetMechanismStore.getState();
  return drugTargetMechanisms.find((dtm) => dtm.id === id);
};

/**
 * Get active drug target mechanism from store
 * @returns The active drug target mechanism or undefined if not set
 */
export const getActiveDrugTargetMechanism = (): DrugTargetMechanism | undefined => {
  const { drugTargetMechanisms, activeDrugTargetMechanismId } = useDrugTargetMechanismStore.getState();
  return drugTargetMechanisms.find((dtm) => dtm.id === activeDrugTargetMechanismId);
};
