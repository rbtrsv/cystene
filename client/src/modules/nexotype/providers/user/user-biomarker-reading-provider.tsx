'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useUserBiomarkerReadingStore } from '@/modules/nexotype/store/user/user-biomarker-reading.store';
import { type UserBiomarkerReading } from '@/modules/nexotype/schemas/user/user-biomarker-reading.schemas';

/**
 * Context type for the user biomarker readings provider
 */
export interface UserBiomarkerReadingContextType {
  // State
  userBiomarkerReadings: UserBiomarkerReading[];
  activeUserBiomarkerReadingId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveUserBiomarkerReading: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const UserBiomarkerReadingContext = createContext<UserBiomarkerReadingContextType | null>(null);

/**
 * Provider component for user biomarker reading-related state and actions
 */
export function UserBiomarkerReadingProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    userBiomarkerReadings,
    activeUserBiomarkerReadingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserBiomarkerReading,
    clearError,
  } = useUserBiomarkerReadingStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useUserBiomarkerReadingStore.persist.rehydrate();
  }, []);

  // Initialize user biomarker readings on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing user biomarker readings:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserBiomarkerReadingContextType>(() => ({
    userBiomarkerReadings,
    activeUserBiomarkerReadingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserBiomarkerReading,
    clearError,
  }), [
    userBiomarkerReadings,
    activeUserBiomarkerReadingId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserBiomarkerReading,
    clearError,
  ]);

  return (
    <UserBiomarkerReadingContext.Provider value={contextValue}>
      {children}
    </UserBiomarkerReadingContext.Provider>
  );
}

/**
 * Default export
 */
export default UserBiomarkerReadingProvider;
