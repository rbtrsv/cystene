'use server';

import { createClient } from '../utils/supabase/supabase-server';
import { db } from '@database/drizzle';
import { userProfiles } from '@database/drizzle/models/accounts';
import { eq, isNull } from 'drizzle-orm';
import { 
  UserProfile, 
  UserProfileResponse,
  UserProfilesResponse,
  CreateUserProfileSchema,
} from '@/modules/accounts/schemas/auth.schemas';

/**
 * Converts a database profile to the UserProfile type
 */
function toUserProfile(dbProfile: any): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.userId,
    email: dbProfile.email,
    name: dbProfile.name,
    role: dbProfile.role,
    createdAt: dbProfile.createdAt,
    updatedAt: dbProfile.updatedAt,
    deletedAt: dbProfile.deletedAt
  };
}

/**
 * Fetches user profile from the database
 * @param userId - The ID of the user to fetch the profile for
 */
export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }
  
  try {
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
    
    return {
      success: true,
      data: toUserProfile(profiles[0])
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      `Error fetching user profile: ${error.message}` : 
      'Unknown error fetching user profile';
    console.error(errorMessage, error);
    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  }
}

/**
 * Creates a user profile in the database
 * @param userId - The user ID from authentication provider
 * @param email - The email address for the user
 * @param name - Optional name for the user profile
 */
export async function createUserProfile(userId: string, email: string, name?: string): Promise<UserProfileResponse> {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }
  
  try {
    // Validate input data with schema
    const validated = CreateUserProfileSchema.safeParse({
      userId,
      email,
      name: name || null,
      role: null
    });
    
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0].message
      };
    }
    
    // Create insert data with required fields only for Drizzle
    // Explicitly type the object to match what Drizzle expects
    const insertData = {
      userId: validated.data.userId,
      email: validated.data.email,
      name: validated.data.name,
      role: validated.data.role
    };
    
    // Insert the profile
    const [newProfile] = await db
      .insert(userProfiles)
      .values(insertData)
      .returning();
    
    if (!newProfile) {
      return {
        success: false,
        error: 'Failed to create user profile: No profile returned from database'
      };
    }
    
    return {
      success: true,
      data: toUserProfile(newProfile)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      `Error creating user profile: ${error.message}` : 
      'Unknown error creating user profile';
    console.error(errorMessage, error);
    
    // Provide more specific error information
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Fetches all user profiles from the database
 * @returns A promise that resolves to an array of user profiles
 */
export async function getAllUserProfiles(): Promise<UserProfilesResponse> {
  try {
    // Get all active user profiles (not deleted)
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(isNull(userProfiles.deletedAt));
    
    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    return {
      success: true,
      data: profiles.map(profile => toUserProfile(profile))
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      `Error fetching user profiles: ${error.message}` : 
      'Unknown error fetching user profiles';
    console.error(errorMessage, error);
    return {
      success: false,
      error: 'Failed to fetch user profiles'
    };
  }
}

/**
 * Gets the current authenticated user with their profile
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) {
      return { user: null, profile: null };
    }
    
    // Get user profile from database
    const profileResult = await getUserProfile(data.user.id);
    let profile = profileResult.success ? profileResult.data : null;
    
    // If no profile exists, create one
    if (!profile && data.user.email) {
      const name = data.user.user_metadata?.name || 
                   data.user.user_metadata?.full_name || 
                   undefined;
                  
      const createResult = await createUserProfile(
        data.user.id, 
        data.user.email,
        name
      );
      
      profile = createResult.success ? createResult.data : null;
      
      if (!profile) {
        return { 
          user: data.user, 
          profile: null, 
          error: createResult.error || 'Failed to create user profile' 
        };
      }
    }
    
    return { user: data.user, profile };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting current user:', errorMessage);
    return { 
      user: null, 
      profile: null, 
      error: `Authentication failed: ${errorMessage}` 
    };
  }
}
