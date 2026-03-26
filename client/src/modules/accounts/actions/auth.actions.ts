'use server';

import { AUTH_ENDPOINTS } from '../utils/api.endpoints';
import { serverFetch } from '../utils/fetch.server';
import { 
  setAccessToken,
  setRefreshToken,
  setTokenExpiry,
  getAccessToken,
  clearAuthCookies
} from '../utils/token.server.utils';

import { 
  type RefreshTokenInput,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type CompleteResetPasswordInput,
  RefreshTokenSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  CompleteResetPasswordSchema
} from '../schemas/auth.schema';
import { MessageResponse } from '../schemas/shared.schemas';

/**
 * Get the authentication token from server-side cookies
 */
export async function getAuthToken(): Promise<string | null> {
  return await getAccessToken();
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginInput): Promise<AuthResponse> {
  LoginSchema.parse(credentials);

  try {
    const response = await serverFetch<AuthResponse>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: credentials,
      useAuth: false
    });

    if (response.success && response.token) {
      await setAccessToken(response.token.access_token);
      await setRefreshToken(response.token.refresh_token);
      // Set token expiry to 1 day from now (matching backend)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      await setTokenExpiry(expiryDate.toISOString());
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
}

/**
 * Register new user
 */
export async function register(userData: RegisterInput): Promise<AuthResponse> {
  RegisterSchema.parse(userData);

  try {
    const response = await serverFetch<AuthResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: userData,
      useAuth: false
    });

    if (response.success && response.token) {
      await setAccessToken(response.token.access_token);
      await setRefreshToken(response.token.refresh_token);
      // Set token expiry to 1 day from now (matching backend)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      await setTokenExpiry(expiryDate.toISOString());
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const response = await serverFetch<AuthResponse>(AUTH_ENDPOINTS.ME, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current user'
    };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<MessageResponse> {
  try {
    const response = await serverFetch<MessageResponse>(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST'
    });

    await clearAuthCookies();
    return response;
  } catch (error) {
    // Always clear cookies even if API call fails (401, network error, etc.)
    await clearAuthCookies();
    
    // Check if the error message indicates a 401 (unauthorized)
    // This happens when user has invalid/expired token - they're already logged out
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return {
        success: true,
        message: 'Logout successful'
      };
    }
    
    // For other errors, still return success since cookies are cleared
    // Logout should always appear to succeed from UX perspective
    return {
      success: true,
      message: 'Logout successful'
    };
  }
}

/**
 * Request password reset email
 */
export async function forgotPassword(data: ResetPasswordInput): Promise<MessageResponse> {
  ResetPasswordSchema.parse(data);

  try {
    const response = await serverFetch<MessageResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: data,
      useAuth: false
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email'
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(data: CompleteResetPasswordInput): Promise<MessageResponse> {
  CompleteResetPasswordSchema.parse(data);

  try {
    const response = await serverFetch<MessageResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: data,
      useAuth: false
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password'
    };
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: RefreshTokenInput): Promise<AuthResponse> {
  RefreshTokenSchema.parse(refreshToken);

  try {
    const response = await serverFetch<AuthResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: refreshToken,
      useAuth: false
    });

    if (response.success && response.token) {
      await setAccessToken(response.token.access_token);
      await setRefreshToken(response.token.refresh_token);
      // Set token expiry to 1 day from now (matching backend)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      await setTokenExpiry(expiryDate.toISOString());
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: ResetPasswordInput): Promise<MessageResponse> {
  ResetPasswordSchema.parse(email);

  try {
    return await serverFetch<MessageResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: email,
      useAuth: false
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset request failed'
    };
  }
}

/**
 * Complete password reset
 */
export async function completePasswordReset(resetData: CompleteResetPasswordInput): Promise<MessageResponse> {
  CompleteResetPasswordSchema.parse(resetData);

  try {
    return await serverFetch<MessageResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: resetData,
      useAuth: false
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed'
    };
  }
}