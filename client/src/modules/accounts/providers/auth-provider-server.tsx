'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth.server.store';
import { type User } from '../schemas/auth.schema';

/**
 * Context type for the auth provider
 */
export interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  clearError: () => void;
}

// Create the context
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider component for auth-related state and actions
 */
export function AuthProvider({ 
  children,
  initialFetch = true
}: { 
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  const pathname = usePathname();
  
  // Get state and actions from the store
  const {
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  } = useAuthStore();
  
  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  // Initialize auth on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    // Skip initialization on public routes
    const publicRoutes = ['/', '/pricing'];
    if (publicRoutes.includes(pathname)) {
      return; // Don't initialize on public routes
    }

    if (initialFetch && !isInitialized) {
      initialize().catch(error => {
        if (isMounted) {
          console.error('Error initializing auth:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetch, isInitialized]); // Intentionally omit pathname to prevent re-runs
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  }), [
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Default export
 */
export default AuthProvider;
