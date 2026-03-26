import type { UserProfile, UserRole } from '@/modules/accounts/schemas/auth.schemas';

export const userRoleHierarchy = {
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

/**
 * Checks if the user's role (from the full UserProfile) meets the required level.
 * This is the recommended way because it uses the UserProfile type from our schema.
 */
export function hasUserPermission(profile: UserProfile, requiredRole: UserRole): boolean {
  // If profile has no role, they don't have permissions
  if (!profile.role) return false;
  
  // Otherwise check role hierarchy
  return userRoleHierarchy[profile.role] >= userRoleHierarchy[requiredRole];
}
