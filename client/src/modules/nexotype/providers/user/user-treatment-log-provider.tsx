'use client';

import React, { createContext, useEffect, useMemo } from 'react';
import { useUserTreatmentLogStore } from '@/modules/nexotype/store/user/user-treatment-log.store';
import { type UserTreatmentLog } from '@/modules/nexotype/schemas/user/user-treatment-log.schemas';

/**
 * Context type for the user treatment logs provider
 */
export interface UserTreatmentLogContextType {
  // State
  userTreatmentLogs: UserTreatmentLog[];
  activeUserTreatmentLogId: number | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveUserTreatmentLog: (id: number | null) => void;
  clearError: () => void;
}

// Create the context
export const UserTreatmentLogContext = createContext<UserTreatmentLogContextType | null>(null);

/**
 * Provider component for user treatment log-related state and actions
 */
export function UserTreatmentLogProvider({
  children,
  initialFetch = true
}: {
  children: React.ReactNode;
  initialFetch?: boolean;
}) {
  // Get state and actions from the store
  const {
    userTreatmentLogs,
    activeUserTreatmentLogId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserTreatmentLog,
    clearError,
  } = useUserTreatmentLogStore();

  // Rehydrate zustand store after React hydration to prevent SSR mismatch
  useEffect(() => {
    useUserTreatmentLogStore.persist.rehydrate();
  }, []);

  // Initialize user treatment logs on mount if initialFetch is true
  useEffect(() => {
    let isMounted = true;

    if (initialFetch && !isInitialized) {
      initialize().catch((error) => {
        if (isMounted) {
          console.error('Error initializing user treatment logs:', error);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialFetch, isInitialized, initialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<UserTreatmentLogContextType>(() => ({
    userTreatmentLogs,
    activeUserTreatmentLogId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserTreatmentLog,
    clearError,
  }), [
    userTreatmentLogs,
    activeUserTreatmentLogId,
    isLoading,
    error,
    isInitialized,
    initialize,
    setActiveUserTreatmentLog,
    clearError,
  ]);

  return (
    <UserTreatmentLogContext.Provider value={contextValue}>
      {children}
    </UserTreatmentLogContext.Provider>
  );
}

/**
 * Default export
 */
export default UserTreatmentLogProvider;
