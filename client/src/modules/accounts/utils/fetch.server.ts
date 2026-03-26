'use server';

import { getAccessToken } from './token.server.utils';

/**
 * Build request headers with authentication token
 * @returns Headers object with authorization token if available
 */
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAccessToken();
  if (!token) return { 'Content-Type': 'application/json' };
  
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

/**
 * Options for serverFetch function
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  useAuth?: boolean;
  customHeaders?: HeadersInit;
  cache?: RequestCache;
  next?: { revalidate?: number };
}

/**
 * Generic server-side API fetch function with error handling
 * @param url API endpoint URL
 * @param options Request options
 * @returns Promise with response data
 */
export const serverFetch = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    useAuth = true,
    customHeaders = {},
    cache = 'no-store',
    next = { revalidate: 0 }
  } = options;

  const headers: HeadersInit = {
    ...(useAuth ? await getAuthHeaders() : { 'Content-Type': 'application/json' }),
    ...customHeaders
  };

  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    cache
  };
  
  // Add next option if provided
  if (next) {
    // Using type assertion to add the 'next' property
    (requestOptions as RequestInit & { next: typeof next }).next = next;
  }

  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail ||
        errorData?.error ||
        errorData?.message ||
        `Request failed with status ${response.status}`
      );
    }
    
    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
