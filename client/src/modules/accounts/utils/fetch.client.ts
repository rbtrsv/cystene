'use client';

import { getAccessToken } from './token.client.utils';

/**
 * Build request headers with authentication token
 * @returns Headers object with authorization token if available
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  
  return token 
    ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

/**
 * Options for fetchClient function
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  useAuth?: boolean;
  customHeaders?: HeadersInit;
}

/**
 * Generic API fetch function with error handling
 * @param url API endpoint URL
 * @param options Request options
 * @returns Promise with response data
 */
export const fetchClient = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    useAuth = true,
    customHeaders = {}
  } = options;

  // Get auth headers
  let headers: HeadersInit = { 'Content-Type': 'application/json', ...customHeaders };
  
  if (useAuth) {
    headers = {
      ...getAuthHeaders(),
      ...customHeaders
    };
  }

  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies in the request
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      
      // Create a custom error with status code for services to handle
      const error = new Error(
        errorData?.detail ||
        errorData?.error ||
        errorData?.message ||
        `Request failed with status ${response.status}`
      );
      
      // Attach status code to error for services to handle appropriately
      (error as Error & { status: number }).status = response.status;
      throw error;
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
