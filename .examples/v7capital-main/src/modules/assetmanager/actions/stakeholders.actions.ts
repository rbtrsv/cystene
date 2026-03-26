'use server';
import { db } from '@database/drizzle';
import { stakeholders, stakeholderUsers, transactions } from '@database/drizzle';
import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel, isStakeholderUser, isGlobalUser } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateStakeholderSchema, 
  UpdateStakeholderSchema,
  type StakeholderResponse,
  type StakeholdersResponse,
  type StakeholderType,
} from '@/modules/assetmanager/schemas/stakeholders.schemas';
// Missing type imports
import { userProfiles } from '@database/drizzle';
import { type StakeholderRole, type StakeholderUserResponse, type StakeholderUsersResponse } from '@/modules/assetmanager/schemas/stakeholders.schemas';
import { CreateStakeholderUserSchema, UpdateStakeholderUserSchema } from '@/modules/assetmanager/schemas/stakeholders.schemas';

/**
 * Get stakeholders that the current user has access to
 * Global users see all, stakeholder users see only their own
 */
export async function getUserStakeholders(): Promise<StakeholdersResponse> {
  return withAuth(async (profile) => {
    try {
      // Global users see all stakeholders
      if (isGlobalUser(profile, Action.VIEW)) {
        const allStakeholders = await db.select().from(stakeholders);

        const typedStakeholders = allStakeholders.map(s => ({
          ...s,
          type: s.type as StakeholderType
        }));

        return {
          success: true,
          data: typedStakeholders
        };
      }

      // Stakeholder users see only their own stakeholders
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder) {
        const result = await db.select().from(stakeholders)
          .innerJoin(stakeholderUsers, eq(stakeholderUsers.stakeholderId, stakeholders.id))
          .where(eq(stakeholderUsers.userProfileId, profile.id));

        const typedStakeholders = result.map(r => ({
          ...r.stakeholders,
          type: r.stakeholders.type as StakeholderType
        }));

        return {
          success: true,
          data: typedStakeholders
        };
      }

      return {
        success: false,
        error: 'Insufficient permissions to view stakeholders'
      };
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      return {
        success: false,
        error: 'Failed to fetch stakeholders'
      };
    }
  });
}

/**
 * Get a single stakeholder by ID
 * @param stakeholderId - ID of the stakeholder to retrieve
 */
export async function getStakeholder(stakeholderId: number): Promise<StakeholderResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view stakeholders
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this stakeholder'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }
      
      const stakeholder = await db.query.stakeholders.findFirst({
        where: eq(stakeholders.id, stakeholderId)
      });
      
      if (!stakeholder) {
        return {
          success: false,
          error: 'Stakeholder not found'
        };
      }
      
      // Convert database type to schema type
      const typedStakeholder = {
        ...stakeholder,
        type: stakeholder.type as StakeholderType
      };
      
      return {
        success: true,
        data: typedStakeholder
      };
    } catch (error) {
      console.error('Error fetching stakeholder:', error);
      return {
        success: false,
        error: 'Failed to fetch stakeholder'
      };
    }
  });
}

/**
 * Create a new stakeholder and associate it with the current user
 * @param data - Stakeholder data from the form
 * @param initialRole - Optional role to assign to the creator (defaults to EDITOR)
 */
export async function createStakeholder(
  data: unknown, 
  initialRole: StakeholderRole = 'EDITOR'
): Promise<StakeholderResponse> {
  const parsed = CreateStakeholderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Prepare stakeholder data
      const stakeholderData = {
        stakeholderName: parsed.data.stakeholderName,
        type: parsed.data.type
      };

      // Insert stakeholder into database
      const [newStakeholder] = await db.insert(stakeholders)
        .values(stakeholderData)
        .returning();
        
      // Create relationship between user and stakeholder with the specified role
      const userStakeholderRelation = {
        userProfileId: profile.id,
        stakeholderId: newStakeholder.id,
        role: initialRole
      };
      
      await db.insert(stakeholderUsers)
        .values(userStakeholderRelation as any);
      
      // Convert database type to schema type
      const typedStakeholder = {
        ...newStakeholder,
        type: newStakeholder.type as StakeholderType
      };
      
      return {
        success: true,
        data: typedStakeholder
      };
    } catch (error) {
      console.error('Error creating stakeholder:', error);
      return {
        success: false,
        error: 'Failed to create stakeholder'
      };
    }
  });
}

/**
 * Update a stakeholder's information
 * @param stakeholderId - ID of the stakeholder to update
 * @param data - Data to update the stakeholder with
 */
export async function updateStakeholder(stakeholderId: number, data: unknown): Promise<StakeholderResponse> {
  const parsed = UpdateStakeholderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update stakeholders
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update stakeholders'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }

      const [updatedStakeholder] = await db.update(stakeholders)
        .set({
          stakeholderName: parsed.data.stakeholderName,
          ...(parsed.data.type && { type: parsed.data.type })
        })
        .where(eq(stakeholders.id, stakeholderId))
        .returning();

      // Convert database type to schema type
      const typedStakeholder = {
        ...updatedStakeholder,
        type: updatedStakeholder.type as StakeholderType
      };

      return {
        success: true,
        data: typedStakeholder
      };
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      return {
        success: false,
        error: 'Failed to update stakeholder'
      };
    }
  });
}

/**
 * Delete a stakeholder
 * @param stakeholderId - ID of the stakeholder to delete
 */
export async function deleteStakeholder(stakeholderId: number): Promise<StakeholderResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete stakeholders
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete stakeholders'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }

      const [deletedStakeholder] = await db.delete(stakeholders)
        .where(eq(stakeholders.id, stakeholderId))
        .returning();

      // Convert database type to schema type
      const typedStakeholder = {
        ...deletedStakeholder,
        type: deletedStakeholder.type as StakeholderType
      };

      return {
        success: true,
        data: typedStakeholder
      };
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      return {
        success: false,
        error: 'Failed to delete stakeholder'
      };
    }
  });
}

/**
 * Get all users for a stakeholder
 * @param stakeholderId - ID of the stakeholder
 */
export async function getStakeholderUsers(stakeholderId: number): Promise<StakeholderUsersResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view stakeholders
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this stakeholder'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }
      
      // Get stakeholder users with profile information
      const result = await db.select({
        userProfileId: stakeholderUsers.userProfileId,
        stakeholderId: stakeholderUsers.stakeholderId,
        role: stakeholderUsers.role,
        profile: {
          id: userProfiles.id,
          name: userProfiles.name,
          email: userProfiles.email
        }
      })
      .from(stakeholderUsers)
      .innerJoin(userProfiles, eq(stakeholderUsers.userProfileId, userProfiles.id))
      .where(eq(stakeholderUsers.stakeholderId, stakeholderId));
      
      // Convert database types to schema types
      const stakeholderUsersList = result.map(r => ({
        userProfileId: r.userProfileId,
        stakeholderId: r.stakeholderId,
        role: r.role as StakeholderRole,
        profile: r.profile
      }));
      
      return {
        success: true,
        data: stakeholderUsersList
      };
    } catch (error) {
      console.error('Error fetching stakeholder users:', error);
      return {
        success: false,
        error: 'Failed to fetch stakeholder users'
      };
    }
  });
}

/**
 * Add a user to a stakeholder
 * @param data - User and stakeholder data
 */
export async function addStakeholderUser(data: unknown): Promise<StakeholderUserResponse> {
  const parsed = CreateStakeholderUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update stakeholders
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this stakeholder'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(parsed.data.stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }
      
      // Check if the user-stakeholder relationship already exists
      const existingRelation = await db.select()
        .from(stakeholderUsers)
        .where(
          and(
            eq(stakeholderUsers.userProfileId, parsed.data.userProfileId),
            eq(stakeholderUsers.stakeholderId, parsed.data.stakeholderId)
          )
        )
        .limit(1);
      
      if (existingRelation.length > 0) {
        return {
          success: false,
          error: 'User is already associated with this stakeholder'
        };
      }
      
      // Create the relationship
      await db.insert(stakeholderUsers)
        .values({
          userProfileId: parsed.data.userProfileId,
          stakeholderId: parsed.data.stakeholderId,
          role: parsed.data.role
        } as any);
      
      return {
        success: true,
        data: {
          userProfileId: parsed.data.userProfileId,
          stakeholderId: parsed.data.stakeholderId,
          role: parsed.data.role
        }
      };
    } catch (error) {
      console.error('Error adding stakeholder user:', error);
      return {
        success: false,
        error: 'Failed to add user to stakeholder'
      };
    }
  });
}

/**
 * Update a user's role in a stakeholder
 * @param userProfileId - ID of the user
 * @param stakeholderId - ID of the stakeholder
 * @param data - Updated role data
 */
export async function updateStakeholderUser(
  userProfileId: number, 
  stakeholderId: number, 
  data: unknown
): Promise<StakeholderUserResponse> {
  const parsed = UpdateStakeholderUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update stakeholders
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this stakeholder'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }
      
      // Update the role - use type assertion to handle the role property
      await db.update(stakeholderUsers)
        .set({ role: parsed.data.role } as any)
        .where(
          and(
            eq(stakeholderUsers.userProfileId, userProfileId),
            eq(stakeholderUsers.stakeholderId, stakeholderId)
          )
        );
      
      return {
        success: true,
        data: {
          userProfileId,
          stakeholderId,
          role: parsed.data.role
        }
      };
    } catch (error) {
      console.error('Error updating stakeholder user:', error);
      return {
        success: false,
        error: 'Failed to update user role'
      };
    }
  });
}

/**
 * Remove a user from a stakeholder
 * @param userProfileId - ID of the user to remove
 * @param stakeholderId - ID of the stakeholder
 */
export async function removeStakeholderUser(
  userProfileId: number, 
  stakeholderId: number
): Promise<StakeholderUserResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update stakeholders
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.STAKEHOLDERS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this stakeholder'
        };
      }
      
      // For stakeholder users, check if they have access to this specific stakeholder
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(stakeholderId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this stakeholder'
        };
      }
      
      // Prevent removing the last admin
      if (profile.id === userProfileId) {
        // Check if this is the last admin
        const adminUsers = await db.select()
          .from(stakeholderUsers)
          .where(
            and(
              eq(stakeholderUsers.stakeholderId, stakeholderId),
              eq(stakeholderUsers.role, 'ADMIN')
            )
          );
        
        if (adminUsers.length <= 1) {
          return {
            success: false,
            error: 'Cannot remove the last admin from a stakeholder'
          };
        }
      }
      
      // Remove the user from the stakeholder
      const [removedRelation] = await db.delete(stakeholderUsers)
        .where(
          and(
            eq(stakeholderUsers.userProfileId, userProfileId),
            eq(stakeholderUsers.stakeholderId, stakeholderId)
          )
        )
        .returning();
      
      if (!removedRelation) {
        return {
          success: false,
          error: 'User is not associated with this stakeholder'
        };
      }
      
      return {
        success: true,
        data: {
          userProfileId,
          stakeholderId,
          role: removedRelation.role as StakeholderRole
        }
      };
    } catch (error) {
      console.error('Error removing stakeholder user:', error);
      return {
        success: false,
        error: 'Failed to remove user from stakeholder'
      };
    }
  });
}