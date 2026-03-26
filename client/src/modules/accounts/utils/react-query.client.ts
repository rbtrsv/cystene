'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale time for queries (5 minutes)
 * Determines how long data remains "fresh" before refetching
 */
const DEFAULT_STALE_TIME = 1000 * 60 * 5;

/**
 * Default cache time for queries (60 minutes)
 * Determines how long inactive data remains in cache
 */
const DEFAULT_CACHE_TIME = 1000 * 60 * 60;

/**
 * Create a singleton QueryClient instance
 * This ensures all components use the same cache
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

/**
 * Helper function to generate a key for storing response data in the cache
 * @param entity Entity name
 * @param id Optional entity ID
 * @param params Optional additional parameters
 * @returns Array representing the query key
 */
export function createQueryKey(
  entity: string, 
  id?: number | null, 
  params?: Record<string, unknown>
): unknown[] {
  const key: unknown[] = [entity];
  if (id !== undefined && id !== null) key.push(id);
  if (params) key.push(params);
  return key;
}

/**
 * Export default QueryClient instance
 */
export default queryClient;