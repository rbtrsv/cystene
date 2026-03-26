'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../providers/auth-provider-client';
import { useAuthStore } from '../store/auth.client.store';
import {
  type User,
  type LoginInput,
  type RegisterInput
} from '../schemas/auth.schema';

/**
 * Hook to use the auth context
 * @throws Error if used outside of an AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Custom hook that combines auth context and store
 * to provide a simplified interface for auth functionality
 * 
 * @returns Auth utilities and state
 */
export function useAuth() {
  // Get data from auth context (like V7Capital)
  const {
    user,
    isLoading: contextLoading,
    error: contextError,
    isInitialized,
    initialize,
    clearError: clearContextError
  } = useAuthContext();

  // Get additional actions from auth store (like V7Capital)
  const {
    login,
    register,
    logout,
    fetchUserData,
    refreshToken,
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useAuthStore();

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    
    // Auth actions
    login,
    register,
    logout,
    fetchUserData,
    refreshToken,
    initialize,
    clearError,
    
    // Helper methods (like V7Capital)
    isAuthenticated: !!user,
    isUser: (u: User | null): u is User => u !== null,
    getUserName: () => user?.name || 'Unknown User',
    getUserEmail: () => user?.email || '',
    getUserId: () => user?.id || null,
    getUserRole: () => user?.role || null,
    
    // Convenience wrapper functions to maintain API compatibility
    loginWithCredentials: async (email: string, password: string) => {
      const credentials: LoginInput = { email, password };
      return await login(credentials);
    },
    
    registerWithData: async (name: string, email: string, password: string) => {
      const userData: RegisterInput = { name, email, password };
      return await register(userData);
    }
  };
}

export default useAuth;
