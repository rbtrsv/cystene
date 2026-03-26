'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useUserVariantStore } from '@/modules/nexotype/store/user/user-variant.store';
import { type UserVariant } from '@/modules/nexotype/schemas/user/user-variant.schemas';

/**
 * Context type for the user variants provider
 */
export interface UserVariantContextType {
  // State
  userVariants: UserVariant[];
  activeUserVariantId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveUserVariant: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const UserVariantContext = createContext<UserVariantContextType | null>(null);

/**
 * Provider component for user variant-related state and actions
 */
export function UserVariantProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    userVariants,
    activeUserVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserVariant,
    clearError,
  } = useUserVariantStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useUserVariantStore.persist.rehydrate();
  }, []);

  // Initialize user variants on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing user variants:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserVariantContextType>(() => ({
    userVariants,
    activeUserVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserVariant,
    clearError,
  }), [
    userVariants,
    activeUserVariantId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserVariant,
    clearError,
  ]);

  return (
    <UserVariantContext.Provider value={contextValue}>
      {children}
    </UserVariantContext.Provider>
  );
}

/**
 * Default export
 */
export default UserVariantProvider;
