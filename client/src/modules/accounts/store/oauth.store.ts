'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  redirectToGoogleAuth,
  exchangeOAuthCode,
  handleOAuthTokens
} from '../actions/oauth.actions';
import { useAuthStore } from './auth.server.store';

/**
 * OAuth store state interface
 */
export interface OAuthState {
  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  redirectToGoogleAuth: () => Promise<void>;
  exchangeOAuthCode: (code: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create OAuth store with Zustand
 * Uses immer middleware for easier state updates
 * Uses devtools middleware for Redux DevTools integration
 */
export const useOAuthStore = create<OAuthState>()(
  devtools(
    immer((set) => ({
      // Initial state
      isLoading: false,
      error: null,
      
      /**
       * Redirect to Google OAuth
       */
      redirectToGoogleAuth: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await redirectToGoogleAuth();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to redirect to Google'
          });
        }
      },
      
      /**
       * Exchange OAuth code for tokens
       */
      exchangeOAuthCode: async (code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Exchange code for tokens
          const codeResponse = await exchangeOAuthCode(code);
          
          if (codeResponse.success && codeResponse.data) {
            // Handle the tokens
            const tokenResponse = await handleOAuthTokens(codeResponse.data);
            
            if (tokenResponse.success) {
              // Update auth store with OAuth user data
              const authStore = useAuthStore.getState();
              
              // Transform OAuth user data to match auth store user schema
              const user = {
                id: codeResponse.data.user.id,
                email: codeResponse.data.user.email,
                name: codeResponse.data.user.name,
                email_verified: codeResponse.data.user.email_verified,
                role: 'MEMBER' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                deleted_at: null
              };
              
              // Update auth store with OAuth user
              authStore.user = user;
              
              set({ isLoading: false });
              return true;
            } else {
              set({ 
                isLoading: false, 
                error: tokenResponse.error || 'Failed to handle OAuth tokens'
              });
              return false;
            }
          } else {
            set({ 
              isLoading: false, 
              error: codeResponse.error || 'Failed to exchange OAuth code'
            });
            return false;
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred during OAuth callback'
          });
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
       * Reset OAuth state to initial values
       */
      reset: () => {
        set({
          isLoading: false,
          error: null
        });
      }
    }))
  )
);