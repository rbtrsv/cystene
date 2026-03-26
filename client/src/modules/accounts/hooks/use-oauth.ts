'use client';

import { useContext, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthContext, OAuthContextType } from '@/modules/accounts/providers/oauth-provider';
import { useOAuthStore } from '@/modules/accounts/store/oauth.store';

/**
 * Hook to use the OAuth context
 * @throws Error if used outside of an OAuthProvider
 */
export function useOAuthContext(): OAuthContextType {
  const context = useContext(OAuthContext);
  
  if (!context) {
    throw new Error('useOAuthContext must be used within an OAuthProvider');
  }
  
  return context;
}

/**
 * Custom hook that combines OAuth context and store
 * to provide a simplified interface for OAuth functionality
 * Automatically handles OAuth callback when code is present in URL
 * 
 * @returns OAuth utilities and state
 */
export function useOAuth() {
  // Get data from OAuth context
  const {
    isLoading: contextLoading,
    error: contextError,
    redirectToGoogleAuth,
    exchangeOAuthCode,
    clearError: clearContextError,
    reset
  } = useOAuthContext();

  // Get additional actions from OAuth store
  const {
    error: storeError,
    isLoading: storeLoading,
    clearError: clearStoreError
  } = useOAuthStore();
  
  // OAuth callback handling
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessedCode = useRef(false);

  // Combine loading and error states
  const isLoading = contextLoading || storeLoading;
  const error = contextError || storeError;
  
  // Combine clear error functions
  const clearError = () => {
    clearContextError();
    clearStoreError();
  };
  
  // Handle OAuth callback automatically when hook is used
  // Detects OAuth code in URL after Google redirect and exchanges it for tokens
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      // Process OAuth code if present and not already processed
      if (code && !hasProcessedCode.current) {
        hasProcessedCode.current = true;
        
        try {
          const success = await exchangeOAuthCode(code);
          
          if (success) {
            router.replace('/');
          } else {
            router.replace('/login?error=oauth_failed');
          }
        } catch (error) {
          console.error('OAuth callback failed:', error);
          router.replace('/login?error=oauth_failed');
        }
      }
    };

    handleCallback();
  }, [searchParams, exchangeOAuthCode, router]);

  return {
    // State
    isLoading,
    error,
    
    // OAuth actions
    redirectToGoogleAuth,
    exchangeOAuthCode,
    clearError,
    reset,
    
    // Helper methods
    isReady: !isLoading && !error,
    isProcessing: isLoading,
    hasError: !!error,
    getErrorMessage: () => error || 'Unknown OAuth error',
    
    // Convenience wrapper functions to maintain API compatibility
    signInWithGoogle: async () => {
      try {
        await redirectToGoogleAuth();
        return true;
      } catch (err) {
        console.error('Failed to redirect to Google:', err);
        return false;
      }
    },
    
    processGoogleCallback: async (code: string) => {
      return await exchangeOAuthCode(code);
    }
  };
}

export default useOAuth;