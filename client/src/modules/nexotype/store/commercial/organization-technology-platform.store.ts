'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  OrganizationTechnologyPlatform,
  CreateOrganizationTechnologyPlatform,
  UpdateOrganizationTechnologyPlatform,
} from '@/modules/nexotype/schemas/commercial/organization-technology-platform.schemas';
import {
  getOrganizationTechnologyPlatforms,
  getOrganizationTechnologyPlatform,
  createOrganizationTechnologyPlatform as apiCreateOrganizationTechnologyPlatform,
  updateOrganizationTechnologyPlatform as apiUpdateOrganizationTechnologyPlatform,
  deleteOrganizationTechnologyPlatform as apiDeleteOrganizationTechnologyPlatform,
  ListOrganizationTechnologyPlatformsParams,
} from '@/modules/nexotype/service/commercial/organization-technology-platform.service';

/**
 * OrganizationTechnologyPlatform store state interface
 */
export interface OrganizationTechnologyPlatformState {
  // State
  organizationTechnologyPlatforms: OrganizationTechnologyPlatform[];
  activeOrganizationTechnologyPlatformId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOrganizationTechnologyPlatforms: (params?: ListOrganizationTechnologyPlatformsParams) => Promise<boolean>;
  fetchOrganizationTechnologyPlatform: (id: number) => Promise<OrganizationTechnologyPlatform | null>;
  createOrganizationTechnologyPlatform: (data: CreateOrganizationTechnologyPlatform) => Promise<boolean>;
  updateOrganizationTechnologyPlatform: (id: number, data: UpdateOrganizationTechnologyPlatform) => Promise<boolean>;
  deleteOrganizationTechnologyPlatform: (id: number) => Promise<boolean>;
  setActiveOrganizationTechnologyPlatform: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create organization technology platform store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOrganizationTechnologyPlatformStore = create<OrganizationTechnologyPlatformState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        organizationTechnologyPlatforms: [],
        activeOrganizationTechnologyPlatformId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize organization technology platforms state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOrganizationTechnologyPlatforms();

            if (response.success && response.data) {
              set((state) => {
                state.organizationTechnologyPlatforms = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize organization technology platforms',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize organization technology platforms',
            });
          }
        },

        /**
         * Fetch all organization technology platforms with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchOrganizationTechnologyPlatforms: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOrganizationTechnologyPlatforms(params);

            if (response.success && response.data) {
              set((state) => {
                state.organizationTechnologyPlatforms = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch organization technology platforms',
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
         * Fetch a specific organization technology platform by ID
         * @param id OrganizationTechnologyPlatform ID
         * @returns Promise with organization technology platform or null
         */
        fetchOrganizationTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getOrganizationTechnologyPlatform(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch organization technology platform with ID ${id}`,
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
         * Create a new organization technology platform
         * @param data OrganizationTechnologyPlatform creation data
         * @returns Success status
         */
        createOrganizationTechnologyPlatform: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateOrganizationTechnologyPlatform(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchOrganizationTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create organization technology platform',
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
         * Update an existing organization technology platform
         * @param id OrganizationTechnologyPlatform ID
         * @param data OrganizationTechnologyPlatform update data
         * @returns Success status
         */
        updateOrganizationTechnologyPlatform: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateOrganizationTechnologyPlatform(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchOrganizationTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update organization technology platform with ID ${id}`,
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
         * Delete a organization technology platform
         * @param id OrganizationTechnologyPlatform ID
         * @returns Success status
         */
        deleteOrganizationTechnologyPlatform: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteOrganizationTechnologyPlatform(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchOrganizationTechnologyPlatforms();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete organization technology platform with ID ${id}`,
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
         * Set active organization technology platform
         * @param id ID of the active organization technology platform or null
         */
        setActiveOrganizationTechnologyPlatform: (id) => {
          set((state) => {
            state.activeOrganizationTechnologyPlatformId = id;
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
            organizationTechnologyPlatforms: [],
            activeOrganizationTechnologyPlatformId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-organization-technology-platform-storage',
        partialize: (state) => ({
          activeOrganizationTechnologyPlatformId: state.activeOrganizationTechnologyPlatformId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get organization technology platform by ID from store
 * @param id OrganizationTechnologyPlatform ID
 * @returns The organization technology platform or undefined if not found
 */
export const getOrganizationTechnologyPlatformById = (id: number): OrganizationTechnologyPlatform | undefined => {
  const { organizationTechnologyPlatforms } = useOrganizationTechnologyPlatformStore.getState();
  return organizationTechnologyPlatforms.find((otp) => otp.id === id);
};

/**
 * Get active organization technology platform from store
 * @returns The active organization technology platform or undefined if not set
 */
export const getActiveOrganizationTechnologyPlatform = (): OrganizationTechnologyPlatform | undefined => {
  const { organizationTechnologyPlatforms, activeOrganizationTechnologyPlatformId } = useOrganizationTechnologyPlatformStore.getState();
  return organizationTechnologyPlatforms.find((otp) => otp.id === activeOrganizationTechnologyPlatformId);
};
