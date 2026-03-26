'use client';

import React, { createContext, useMemo } from 'react';
import { useOAuthStore } from '../store/oauth.store';

/**
 * Context type for the OAuth provider
 */
export interface OAuthContextType {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  redirectToGoogleAuth: () => Promise<void>;
  exchangeOAuthCode: (code: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// Create the context
export const OAuthContext = createContext<OAuthContextType | null>(null);

/**
 * Provider component for OAuth-related state and actions
 */
export function OAuthProvider({ 
  children
}: { 
  children: React.ReactNode;
}) {
  // Get state and actions from the store
  const {
    isLoading,
    error,
    redirectToGoogleAuth,
    exchangeOAuthCode,
    clearError,
    reset
  } = useOAuthStore();
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OAuthContextType>(() => ({
    isLoading,
    error,
    redirectToGoogleAuth,
    exchangeOAuthCode,
    clearError,
    reset
  }), [
    isLoading,
    error,
    redirectToGoogleAuth,
    exchangeOAuthCode,
    clearError,
    reset
  ]);
  
  return (
    <OAuthContext.Provider value={contextValue}>
      {children}
    </OAuthContext.Provider>
  );
}

/**
 * Default export
 */
export default OAuthProvider;