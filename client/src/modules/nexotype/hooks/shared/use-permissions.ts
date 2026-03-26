'use client';

import { useContext } from 'react';
import { PermissionsContext, PermissionsContextType } from '@/modules/nexotype/providers/shared/permissions-provider';
import { usePermissionsStore } from '@/modules/nexotype/store/shared/permissions.store';

/**
 * Hook to use the permissions context
 * @throws Error if used outside of a PermissionsProvider
 */
export function usePermissionsContext(): PermissionsContextType {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }

  return context;
}

/**
 * Custom hook that provides permission checking utilities.
 *
 * Uses the backend as single source of truth — no tier maps or
 * permission logic exists client-side. The backend computes everything
 * and the frontend just reads booleans.
 *
 * @returns Permission utilities and state
 */
export function usePermissions() {
  // Get data from permissions context
  const {
    permissions,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearError,
  } = usePermissionsContext();

  /**
   * Check if the user can read a domain or entity.
   * Checks entity override first, falls back to domain.
   *
   * @param domain Domain name (e.g. "omics", "commercial")
   * @param entity Optional entity name for override lookup (e.g. "gene", "subject")
   * @returns true if the user has read access
   */
  const canRead = (domain: string, entity?: string): boolean => {
    if (!permissions) return false;

    // Check entity override first
    if (entity && permissions.entities[entity]) {
      return permissions.entities[entity].can_read;
    }

    // Fall back to domain
    if (permissions.domains[domain]) {
      return permissions.domains[domain].can_read;
    }

    return false;
  };

  /**
   * Check if the user can write to a domain or entity.
   * Checks entity override first, falls back to domain.
   *
   * @param domain Domain name (e.g. "omics", "commercial")
   * @param entity Optional entity name for override lookup (e.g. "gene", "subject")
   * @returns true if the user has write access
   */
  const canWrite = (domain: string, entity?: string): boolean => {
    if (!permissions) return false;

    // Check entity override first
    if (entity && permissions.entities[entity]) {
      return permissions.entities[entity].can_write;
    }

    // Fall back to domain
    if (permissions.domains[domain]) {
      return permissions.domains[domain].can_write;
    }

    return false;
  };

  // Why: Used by PageGate in layout.tsx to check if current route is locked
  const isRouteLocked = (route: string): boolean => {
    if (!permissions?.routes) return false;
    const key = route.replace(/^\//, '');
    return permissions.routes[key] ? !permissions.routes[key].can_read : false;
  };

  // Why: Used by UpgradeRequired to display required tier badge
  const getRouteTier = (route: string): string | null => {
    if (!permissions?.routes) return null;
    const key = route.replace(/^\//, '');
    return permissions.routes[key]?.read_tier ?? null;
  };

  // Why: Used by UpgradeRequired to display feature name
  const getRouteDisplayName = (route: string): string | null => {
    if (!permissions?.routes) return null;
    const key = route.replace(/^\//, '');
    return permissions.routes[key]?.display_name ?? null;
  };

  return {
    // State
    permissions,
    isLoading,
    error,
    isInitialized,

    // Permission checks
    canRead,
    canWrite,

    // Route-level checks (PageGate + sidebar)
    isRouteLocked,
    getRouteTier,
    getRouteDisplayName,

    // Actions
    initialize,
    clearError,
  };
}

export default usePermissions;
