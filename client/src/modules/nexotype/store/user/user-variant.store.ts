'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UserVariant,
  CreateUserVariant,
  UpdateUserVariant,
} from '@/modules/nexotype/schemas/user/user-variant.schemas';
import {
  getUserVariants,
  getUserVariant,
  createUserVariant as apiCreateUserVariant,
  updateUserVariant as apiUpdateUserVariant,
  deleteUserVariant as apiDeleteUserVariant,
  ListUserVariantsParams,
} from '@/modules/nexotype/service/user/user-variant.service';

/**
 * UserVariant store state interface
 */
export interface UserVariantState {
  // State
  userVariants: UserVariant[];
  activeUserVariantId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUserVariants: (params?: ListUserVariantsParams) => Promise<boolean>;
  fetchUserVariant: (id: number) => Promise<UserVariant | null>;
  createUserVariant: (data: CreateUserVariant) => Promise<boolean>;
  updateUserVariant: (id: number, data: UpdateUserVariant) => Promise<boolean>;
  deleteUserVariant: (id: number) => Promise<boolean>;
  setActiveUserVariant: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create user variant store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useUserVariantStore = create<UserVariantState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        userVariants: [],
        activeUserVariantId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize user variants state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserVariants();

            if (response.success && response.data) {
              set((state) => {
                state.userVariants = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize user variants',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize user variants',
            });
          }
        },

        /**
         * Fetch all user variants with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchUserVariants: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserVariants(params);

            if (response.success && response.data) {
              set((state) => {
                state.userVariants = response.data || [];
                state.isLoading = false;
              });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to fetch user variants',
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
         * Fetch a specific user variant by ID
         * @param id UserVariant ID
         * @returns Promise with user variant or null
         */
        fetchUserVariant: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserVariant(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to fetch user variant with ID ${id}`,
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
         * Create a new user variant
         * @param data UserVariant creation data
         * @returns Success status
         */
        createUserVariant: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateUserVariant(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchUserVariants();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create user variant',
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
         * Update an existing user variant
         * @param id UserVariant ID
         * @param data UserVariant update data
         * @returns Success status
         */
        updateUserVariant: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateUserVariant(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchUserVariants();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update user variant with ID ${id}`,
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
         * Delete a user variant
         * @param id UserVariant ID
         * @returns Success status
         */
        deleteUserVariant: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteUserVariant(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchUserVariants();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete user variant with ID ${id}`,
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
         * Set active user variant
         * @param id ID of the active user variant or null
         */
        setActiveUserVariant: (id) => {
          set((state) => {
            state.activeUserVariantId = id;
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
            userVariants: [],
            activeUserVariantId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        },
      })),
      {
        name: 'nexotype-user-variant-storage',
        partialize: (state) => ({
          activeUserVariantId: state.activeUserVariantId,
        }),
        skipHydration: true,
      }
    )
  )
);

/**
 * Helper function to get user variant by ID from store
 * @param id UserVariant ID
 * @returns The user variant or undefined if not found
 */
export const getUserVariantById = (id: number): UserVariant | undefined => {
  const { userVariants } = useUserVariantStore.getState();
  return userVariants.find((uv) => uv.id === id);
};

/**
 * Get active user variant from store
 * @returns The active user variant or undefined if not set
 */
export const getActiveUserVariant = (): UserVariant | undefined => {
  const { userVariants, activeUserVariantId } = useUserVariantStore.getState();
  return userVariants.find((uv) => uv.id === activeUserVariantId);
};
