'use client';

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

import { AUTH_ENDPOINTS } from '../utils/api.endpoints';
import { fetchClient } from '../utils/fetch.client';
import { 
  setAccessToken,
  setRefreshToken,
  clearAuthCookies
} from '../utils/token.client.utils';

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginInput): Promise<AuthResponse> => {
  LoginSchema.parse(credentials);

  try {
    const response = await fetchClient<AuthResponse>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: credentials,
      useAuth: false
    });

    if (response.success && response.token) {
      setAccessToken(response.token.access_token);
      setRefreshToken(response.token.refresh_token);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

/**
 * Register new user
 */
export const register = async (userData: RegisterInput): Promise<AuthResponse> => {
  RegisterSchema.parse(userData);

  try {
    const response = await fetchClient<AuthResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: userData,
      useAuth: false
    });

    if (response.success && response.token) {
      setAccessToken(response.token.access_token);
      setRefreshToken(response.token.refresh_token);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

/**
 * Get current user session
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await fetchClient<AuthResponse>(AUTH_ENDPOINTS.ME, {
      method: 'GET'
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current user'
    };
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<MessageResponse> => {
  try {
    const response = await fetchClient<MessageResponse>(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST'
    });

    clearAuthCookies();
    return response;
  } catch (error) {
    // Always clear cookies even if API call fails (401, network error, etc.)
    clearAuthCookies();
    
    // If it's a 401, that's expected - user is already logged out server-side
    const errorWithStatus = error as Error & { status?: number };
    if (errorWithStatus.status === 401) {
      return {
        success: true,
        message: 'Logout successful'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed'
    };
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: RefreshTokenInput): Promise<AuthResponse> => {
  RefreshTokenSchema.parse(refreshToken);

  try {
    const response = await fetchClient<AuthResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: refreshToken,
      useAuth: false
    });

    if (response.success && response.token) {
      setAccessToken(response.token.access_token);
      setRefreshToken(response.token.refresh_token);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: ResetPasswordInput): Promise<MessageResponse> => {
  ResetPasswordSchema.parse(email);

  try {
    return await fetchClient<MessageResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
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
};

/**
 * Complete password reset
 */
export const completePasswordReset = async (resetData: CompleteResetPasswordInput): Promise<MessageResponse> => {
  CompleteResetPasswordSchema.parse(resetData);

  try {
    return await fetchClient<MessageResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, {
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
};