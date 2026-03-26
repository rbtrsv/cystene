'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useUserProfileStore } from '@/modules/nexotype/store/user/user-profile.store';
import { type UserProfile } from '@/modules/nexotype/schemas/user/user-profile.schemas';

/**
 * Context type for the user profiles provider
 */
export interface UserProfileContextType {
  // State
  userProfiles: UserProfile[];
  activeUserProfileId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveUserProfile: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const UserProfileContext = createContext<UserProfileContextType | null>(null);

/**
 * Provider component for user profile-related state and actions
 */
export function UserProfileProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    userProfiles,
    activeUserProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserProfile,
    clearError,
  } = useUserProfileStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useUserProfileStore.persist.rehydrate();
  }, []);

  // Initialize user profiles on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing user profiles:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserProfileContextType>(() => ({
    userProfiles,
    activeUserProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserProfile,
    clearError,
  }), [
    userProfiles,
    activeUserProfileId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserProfile,
    clearError,
  ]);

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

/**
 * Default export
 */
export default UserProfileProvider;
