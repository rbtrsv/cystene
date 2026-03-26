'use server';

import { cookies } from 'next/headers';

/**
 * Token utilities for managing authentication tokens using server-side cookies
 */

/**
 * Cookie options interface
 */
interface CookieOptions {
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
}

/**
 * Cookie options for token storage
 */
// Using 'lax' instead of 'strict' because Stripe Billing Portal redirects
// back to our app from billing.stripe.com — with 'strict', the browser
// won't send cookies on cross-origin redirects, causing a false login redirect.
// 'lax' sends cookies on top-level GET navigations (safe for redirects)
// while still blocking cross-site POST requests (CSRF protection preserved).
const cookieOptions: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  httpOnly: false, // Allow client services to read tokens
};

/**
 * Cookie names for various token-related data
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'nudgio_access_token',
  REFRESH_TOKEN: 'nudgio_refresh_token',
  TOKEN_EXPIRY: 'nudgio_token_expiry',
};

/**
 * Set access token in a cookie
 * @param token Access token string
 */
export const setAccessToken = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, token, cookieOptions);
};

/**
 * Get access token from cookie
 * @returns Access token string or null if not found
 */
export const getAccessToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value || null;
};

/**
 * Remove access token cookie
 */
export const removeAccessToken = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
};

/**
 * Set refresh token in a cookie
 * @param token Refresh token string
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  // Refresh tokens typically have a longer lifespan
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
};

/**
 * Get refresh token from cookie
 * @returns Refresh token string or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value || null;
};

/**
 * Remove refresh token cookie
 */
export const removeRefreshToken = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
};

/**
 * Set token expiry timestamp in a cookie
 * @param expiryDate Token expiry date string
 */
export const setTokenExpiry = async (expiryDate: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.TOKEN_EXPIRY, expiryDate, cookieOptions);
};

/**
 * Get token expiry timestamp from cookie
 * @returns Token expiry date string or null if not found
 */
export const getTokenExpiry = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.TOKEN_EXPIRY)?.value || null;
};

/**
 * Remove token expiry cookie
 */
export const removeTokenExpiry = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.TOKEN_EXPIRY);
};

/**
 * Clear all authentication cookies
 */
export const clearAuthCookies = async (): Promise<void> => {
  await removeAccessToken();
  await removeRefreshToken();
  await removeTokenExpiry();
};

/**
 * Check if token is expired by comparing with current time
 * @returns True if token expiry date is in the past or not found, false otherwise
 */
export const isTokenExpired = async (): Promise<boolean> => {
  const expiryString = await getTokenExpiry();
  if (!expiryString) return true;
  
  try {
    const expiryDate = new Date(expiryString);
    return expiryDate <= new Date();
  } catch (error) {
    console.error('Failed to parse token expiry date:', error);
    return true;
  }
};
