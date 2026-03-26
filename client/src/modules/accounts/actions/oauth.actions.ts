'use server';

import { redirect } from 'next/navigation';
import { OAUTH_ENDPOINTS } from '../utils/api.endpoints';

import { 
  setAccessToken,
  setRefreshToken,
} from '../utils/token.server.utils';

import { 
  type GoogleCallback,
  GoogleCallbackSchema
} from '../schemas/oauth.schema';

/**
 * Redirect to Google OAuth
 */
export async function redirectToGoogleAuth(): Promise<void> {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_FRONTEND_URL}/login&scope=openid email profile&access_type=offline`;
  redirect(googleAuthUrl);
}

/**
 * Exchange OAuth code for tokens
 */
export async function exchangeOAuthCode(code: string): Promise<{ success: boolean; data?: GoogleCallback; error?: string }> {
  try {
    const response = await fetch(OAUTH_ENDPOINTS.GOOGLE_CALLBACK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    GoogleCallbackSchema.parse(data);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to exchange OAuth code'
    };
  }
}

/**
 * Handle OAuth tokens - set them in cookies
 */
export async function handleOAuthTokens(tokens: GoogleCallback): Promise<{ success: boolean; error?: string }> {
  try {
    GoogleCallbackSchema.parse(tokens);
    
    await setAccessToken(tokens.access_token);
    await setRefreshToken(tokens.refresh_token);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle OAuth tokens'
    };
  }
}