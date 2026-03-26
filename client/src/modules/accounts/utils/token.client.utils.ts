'use client';

/**
 * Token utilities for managing authentication tokens using cookies
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
};

/**
 * Cookie names for various token-related data
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'nudgio_access_token',
  REFRESH_TOKEN: 'nudgio_refresh_token',
  TOKEN_EXPIRY: 'nudgio_token_expiry',
};

/**
 * Set a cookie with the specified name and value
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') return;
  
  const optionsWithDefaults: CookieOptions = {
    ...cookieOptions,
    ...options,
  };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (optionsWithDefaults.path) {
    cookieString += `; path=${optionsWithDefaults.path}`;
  }
  
  if (optionsWithDefaults.maxAge) {
    cookieString += `; max-age=${optionsWithDefaults.maxAge}`;
  }
  
  if (optionsWithDefaults.expires) {
    cookieString += `; expires=${optionsWithDefaults.expires.toUTCString()}`;
  }
  
  if (optionsWithDefaults.secure) {
    cookieString += '; secure';
  }
  
  if (optionsWithDefaults.sameSite) {
    cookieString += `; samesite=${optionsWithDefaults.sameSite}`;
  }
  
  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const nameEncoded = encodeURIComponent(name);
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    
    if (cookie.indexOf(`${nameEncoded}=`) === 0) {
      return decodeURIComponent(cookie.substring(nameEncoded.length + 1));
    }
  }
  
  return null;
};

/**
 * Remove a cookie by name
 * @param name Cookie name
 * @param path Cookie path
 */
const removeCookie = (name: string, path = '/'): void => {
  if (typeof document === 'undefined') return;
  
  // Set expiration to past date to delete the cookie
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

/**
 * Set access token in a cookie
 * @param token Access token string
 */
export const setAccessToken = (token: string): void => {
  setCookie(COOKIE_NAMES.ACCESS_TOKEN, token);
};

/**
 * Get access token from cookie
 * @returns Access token string or null if not found
 */
export const getAccessToken = (): string | null => {
  return getCookie(COOKIE_NAMES.ACCESS_TOKEN);
};

/**
 * Remove access token cookie
 */
export const removeAccessToken = (): void => {
  removeCookie(COOKIE_NAMES.ACCESS_TOKEN);
};

/**
 * Set refresh token in a cookie
 * @param token Refresh token string
 */
export const setRefreshToken = (token: string): void => {
  setCookie(COOKIE_NAMES.REFRESH_TOKEN, token);
};

/**
 * Get refresh token from cookie
 * @returns Refresh token string or null if not found
 */
export const getRefreshToken = (): string | null => {
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
};

/**
 * Remove refresh token cookie
 */
export const removeRefreshToken = (): void => {
  removeCookie(COOKIE_NAMES.REFRESH_TOKEN);
};

/**
 * Set token expiry timestamp in a cookie
 * @param expiryDate Token expiry date string
 */
export const setTokenExpiry = (expiryDate: string): void => {
  setCookie(COOKIE_NAMES.TOKEN_EXPIRY, expiryDate);
};

/**
 * Get token expiry timestamp from cookie
 * @returns Token expiry date string or null if not found
 */
export const getTokenExpiry = (): string | null => {
  return getCookie(COOKIE_NAMES.TOKEN_EXPIRY);
};

/**
 * Remove token expiry cookie
 */
export const removeTokenExpiry = (): void => {
  removeCookie(COOKIE_NAMES.TOKEN_EXPIRY);
};

/**
 * Clear all authentication cookies
 */
export const clearAuthCookies = (): void => {
  removeAccessToken();
  removeRefreshToken();
  removeTokenExpiry();
};

/**
 * Check if token is expired by comparing with current time
 * @returns True if token expiry date is in the past or not found, false otherwise
 */
export const isTokenExpired = (): boolean => {
  const expiryString = getTokenExpiry();
  if (!expiryString) return true;
  
  try {
    const expiryDate = new Date(expiryString);
    return expiryDate <= new Date();
  } catch (error) {
    console.error('Failed to parse token expiry date:', error);
    return true;
  }
};