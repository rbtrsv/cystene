'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, LoginInput, RegisterInput } from '../schemas/auth.schema';
import { 
  clearAuthCookies,
  getAccessToken,
  getRefreshToken
} from '../utils/token.client.utils';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
  refreshAccessToken as apiRefreshToken
} from '../service/auth.service';

/**
 * Authentication store state interface
 */
export interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions (all async operations in store like V7Capital)
  initialize: () => Promise<void>;
  login: (credentials: LoginInput) => Promise<boolean>;
  register: (userData: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create auth store with Zustand
 * Uses persist middleware to maintain state across page refreshes
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        error: null,
        isInitialized: false,
        
        /**
         * Initialize auth state (like V7Capital fetchCompanies on mount)
         */
        initialize: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();
            
            if (accessToken && refreshToken) {
              // Try to fetch user data with existing tokens
              const response = await apiGetCurrentUser();
              
              if (response.success && response.data) {
                const userData = response.data;
                set((state) => {
                  state.user = userData.user;
                  state.isInitialized = true;
                  state.isLoading = false;
                });
              } else {
                // Invalid tokens, clear them
                clearAuthCookies();
                set((state) => {
                  state.isInitialized = true;
                  state.isLoading = false;
                });
              }
            } else {
              // No tokens, just mark as initialized
              set((state) => {
                state.isInitialized = true;
                state.isLoading = false;
              });
            }
          } catch (error) {
            set({
              isInitialized: true,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to initialize auth'
            });
          }
        },
        
        /**
         * Login user (like V7Capital createCompany)
         * @param credentials User login credentials
         * @returns Success status
         */
        login: async (credentials: LoginInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiLogin(credentials);
            
            if (response.success && response.data) {
              const userData = response.data;
              set((state) => {
                state.user = userData.user;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Login failed'
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
         * Register new user (like V7Capital createCompany)
         * @param userData User registration data
         * @returns Success status
         */
        register: async (userData: RegisterInput) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiRegister(userData);
            
            if (response.success && response.data) {
              const userResponseData = response.data;
              set((state) => {
                state.user = userResponseData.user;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Registration failed'
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
         * Logout current user (like V7Capital removeCompany)
         */
        logout: async () => {
          set({ isLoading: true });
          
          try {
            await apiLogout();
          } catch (error) {
            console.error('Logout error:', error instanceof Error ? error.message : error);
          } finally {
            // Always reset state regardless of API response
            set((state) => {
              state.user = null;
              state.isLoading = false;
              state.error = null;
            });
          }
        },
        
        /**
         * Fetch current user data (like V7Capital fetchCompany)
         * @returns Success status
         */
        fetchUserData: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiGetCurrentUser();
            
            if (response.success && response.data) {
              const userResponseData = response.data;
              set((state) => {
                state.user = userResponseData.user;
                state.isLoading = false;
              });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: response.error || 'Failed to fetch user data'
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
         * Refresh access token
         * @returns Success status
         */
        refreshToken: async () => {
          try {
            const refreshTokenValue = getRefreshToken();
            if (!refreshTokenValue) {
              get().reset();
              return false;
            }
            
            const response = await apiRefreshToken({ refresh_token: refreshTokenValue });
            
            if (response.success) {
              return true;
            } else {
              // If refresh fails, reset auth state
              get().reset();
              return false;
            }
          } catch (error) {
            console.error('Token refresh error:', error instanceof Error ? error.message : error);
            get().reset();
            return false;
          }
        },
        
        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
        
        /**
         * Reset auth state to initial values
         */
        reset: () => {
          set({
            user: null,
            isLoading: false,
            error: null,
            isInitialized: true
          });
          
          // Clear cookies on reset
          clearAuthCookies();
        }
      })),
      {
        name: 'nexotype-auth-storage',
        partialize: (state) => ({
          user: state.user,
        }),
        skipHydration: true,
      }
    )
  )
);
