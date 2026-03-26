'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  LicensingAgreement,
  CreateLicensingAgreement,
  UpdateLicensingAgreement,
} from '@/modules/nexotype/schemas/commercial/licensing-agreement.schemas';
import {
  getLicensingAgreements,
  getLicensingAgreement,
  createLicensingAgreement as apiCreateLicensingAgreement,
  updateLicensingAgreement as apiUpdateLicensingAgreement,
  deleteLicensingAgreement as apiDeleteLicensingAgreement,
  ListLicensingAgreementsParams,
} from '@/modules/nexotype/service/commercial/licensing-agreement.service';

/**
 * LicensingAgreement store state interface
 */
export interface LicensingAgreementState {
  // State
  licensingAgreements: LicensingAgreement[];
  activeLicensingAgreementId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchLicensingAgreements: (params?: ListLicensingAgreementsParams) => Promise<boolean>;
  fetchLicensingAgreement: (id: number) => Promise<LicensingAgreement | null>;
  createLicensingAgreement: (data: CreateLicensingAgreement) => Promise<boolean>;
  updateLicensingAgreement: (id: number, data: UpdateLicensingAgreement) => Promise<boolean>;
  deleteLicensingAgreement: (id: number) => Promise<boolean>;
  setActiveLicensingAgreement: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create licensing agreement store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useLicensingAgreementStore = create<LicensingAgreementState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        licensingAgreements: [],
        activeLicensingAgreementId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize licensing agreements state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getLicensingAgreements();

            if (response.success && response.data) {
              set((state) => {
                state.licensingAgreements = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize licensing agreements',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize licensing agreements',
            });
          }
        },

        /**
         * Fetch all licensing agreements with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchLicensingAgreements: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getLicensingAgreements(params);

            if (response.success && response.data) {
              set((state) => {
                state.licensingAgreements = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch licensing agreements',
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
         * Fetch a specific licensing agreement by ID
         * @param id LicensingAgreement ID
         * @returns Promise with licensing agreement or null
         */
        fetchLicensingAgreement: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getLicensingAgreement(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch licensing agreement with ID ${id}`,
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
         * Create a new licensing agreement
         * @param data LicensingAgreement creation data
         * @returns Success status
         */
        createLicensingAgreement: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateLicensingAgreement(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchLicensingAgreements();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create licensing agreement',
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
         * Update an existing licensing agreement
         * @param id LicensingAgreement ID
         * @param data LicensingAgreement update data
         * @returns Success status
         */
        updateLicensingAgreement: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateLicensingAgreement(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchLicensingAgreements();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update licensing agreement with ID ${id}`,
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
         * Delete a licensing agreement
         * @param id LicensingAgreement ID
         * @returns Success status
         */
        deleteLicensingAgreement: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteLicensingAgreement(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchLicensingAgreements();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete licensing agreement with ID ${id}`,
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
         * Set active licensing agreement
         * @param id ID of the active licensing agreement or null
         */
        setActiveLicensingAgreement: (id) => {
          set((state) => {
            state.activeLicensingAgreementId = id;
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
            licensingAgreements: [],
            activeLicensingAgreementId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-licensing-agreement-storage',
        partialize: (state) => ({
          activeLicensingAgreementId: state.activeLicensingAgreementId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get licensing agreement by ID from store
 * @param id LicensingAgreement ID
 * @returns The licensing agreement or undefined if not found
 */
export const getLicensingAgreementById = (id: number): LicensingAgreement | undefined => {
  const { licensingAgreements } = useLicensingAgreementStore.getState();
  return licensingAgreements.find((la) => la.id === id);
};

/**
 * Get active licensing agreement from store
 * @returns The active licensing agreement or undefined if not set
 */
export const getActiveLicensingAgreement = (): LicensingAgreement | undefined => {
  const { licensingAgreements, activeLicensingAgreementId } = useLicensingAgreementStore.getState();
  return licensingAgreements.find((la) => la.id === activeLicensingAgreementId);
};
