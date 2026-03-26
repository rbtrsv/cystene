'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/modules/accounts/actions/auth.actions';
import { type UserProfile } from '@/modules/accounts/schemas/auth.schemas';

/**
 * Helper function that ensures a user is authenticated
 * before executing the provided callback
 */
export async function withAuth<T>(
  callback: (profile: UserProfile) => Promise<T>,
  options?: {
    redirectTo?: string;
  }
): Promise<T> {
  // Get current user session
  const { user, profile } = await getCurrentUser();
  
  if (!user) {
    if (options?.redirectTo) redirect(options.redirectTo);
    throw new Error('Unauthorized');
  }
  
  if (!profile) {
    if (options?.redirectTo) redirect(options.redirectTo);
    throw new Error('User profile not found');
  }
  
  // Execute the callback with the profile
  return callback(profile);
}
