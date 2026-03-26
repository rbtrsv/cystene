'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UserProfile,
  CreateUserProfile,
  UpdateUserProfile,
} from '@/modules/nexotype/schemas/user/user-profile.schemas';
import {
  getUserProfiles,
  getUserProfile,
  createUserProfile as apiCreateUserProfile,
  updateUserProfile as apiUpdateUserProfile,
  deleteUserProfile as apiDeleteUserProfile,
  ListUserProfilesParams,
} from '@/modules/nexotype/service/user/user-profile.service';

/**
 * UserProfile store state interface
 */
export interface UserProfileState {
  // State
  userProfiles: UserProfile[];
  activeUserProfileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchUserProfiles: (params?: ListUserProfilesParams) => Promise<boolean>;
  fetchUserProfile: (id: number) => Promise<UserProfile | null>;
  createUserProfile: (data: CreateUserProfile) => Promise<boolean>;
  updateUserProfile: (id: number, data: UpdateUserProfile) => Promise<boolean>;
  deleteUserProfile: (id: number) => Promise<boolean>;
  setActiveUserProfile: (id: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create user profile store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useUserProfileStore = create<UserProfileState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        userProfiles: [],
        activeUserProfileId: null,
        isLoading: false,
        error: null,
        isInitialized: false,

        /**
         * Initialize user profiles state
         */
        initialize: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserProfiles();

            if (response.success && response.data) {
              set((state) => {
                state.userProfiles = response.data || [];
                state.isInitialized = true;
                state.isLoading = false;
              });
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                error: response.error || 'Failed to initialize user profiles',
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize user profiles',
            });
          }
        },

        /**
         * Fetch all user profiles with optional pagination
         * @param params Optional query parameters for pagination
         * @returns Success status
         */
        fetchUserProfiles: async (params) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserProfiles(params);

            if (response.success && response.data) {
              set((state) => {
                state.userProfiles = response.data || [];
                state.isLoading = false;
              });
              return true;
            }
            set({
              isLoading: false,
              error: response.error || 'Failed to fetch user profiles',
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
         * Fetch a specific user profile by ID
         * @param id UserProfile ID
         * @returns Promise with user profile or null
         */
        fetchUserProfile: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await getUserProfile(id);

            if (response.success && response.data) {
              set({ isLoading: false });
              return response.data;
            }
            set({
              isLoading: false,
              error: response.error || `Failed to fetch user profile with ID ${id}`,
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
         * Create a new user profile
         * @param data UserProfile creation data
         * @returns Success status
         */
        createUserProfile: async (data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiCreateUserProfile(data);

            if (response.success && response.data) {
              // After creating, refresh list
              await get().fetchUserProfiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || 'Failed to create user profile',
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
         * Update an existing user profile
         * @param id UserProfile ID
         * @param data UserProfile update data
         * @returns Success status
         */
        updateUserProfile: async (id, data) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiUpdateUserProfile(id, data);

            if (response.success && response.data) {
              // After updating, refresh list
              await get().fetchUserProfiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to update user profile with ID ${id}`,
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
         * Delete a user profile
         * @param id UserProfile ID
         * @returns Success status
         */
        deleteUserProfile: async (id) => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiDeleteUserProfile(id);

            if (response.success) {
              // After deleting, refresh list
              await get().fetchUserProfiles();
              set({ isLoading: false });
              return true;
            }

            set({
              isLoading: false,
              error: response.error || `Failed to delete user profile with ID ${id}`,
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
         * Set active user profile
         * @param id ID of the active user profile or null
         */
        setActiveUserProfile: (id) =>
          set((state) => {
            state.activeUserProfileId = id;
          }),

        /**
         * Clear error message
         */
        clearError: () => set({ error: null }),

        /**
         * Reset state to initial values
         */
        reset: () =>
          set({
            userProfiles: [],
            activeUserProfileId: null,
            isLoading: false,
            error: null,
            isInitialized: false,
          }),
      })),
      {
        name: 'nexotype-user-profile-storage',
        partialize: (state) => ({
          activeUserProfileId: state.activeUserProfileId,
        }),
        skipHydration: true,
      },
    ),
  ),
);

/**
 * Helper function to get user profile by ID from store
 * @param id UserProfile ID
 * @returns The user profile or undefined if not found
 */
export const getUserProfileById = (id: number): UserProfile | undefined => {
  const { userProfiles } = useUserProfileStore.getState();
  return userProfiles.find((up) => up.id === id);
};

/**
 * Get active user profile from store
 * @returns The active user profile or undefined if not set
 */
export const getActiveUserProfile = (): UserProfile | undefined => {
  const { userProfiles, activeUserProfileId } = useUserProfileStore.getState();
  return userProfiles.find((up) => up.id === activeUserProfileId);
};
