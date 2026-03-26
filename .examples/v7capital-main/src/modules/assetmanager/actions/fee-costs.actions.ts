'use server';

import { db } from '@database/drizzle';
import { feeCosts } from '@database/drizzle/models/captable';
import { eq, inArray, and } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateFeeCostSchema, 
  UpdateFeeCostSchema,
  type FeeCostResponse,
  type FeeCostsResponse,
  type FeeCost,
  type FeeCostType,
  type Frequency
} from '@/modules/assetmanager/schemas/fee-costs.schemas';

/**
 * Convert database record to typed fee cost
 */
function convertToTypedFeeCost(dbRecord: any): FeeCost {
  return {
    id: dbRecord.id,
    feeCostType: dbRecord.feeCostType as FeeCostType,
    fundId: dbRecord.fundId,
    roundId: dbRecord.roundId,
    feeCostName: dbRecord.feeCostName,
    frequency: dbRecord.frequency as Frequency,
    amount: dbRecord.amount ? Number(dbRecord.amount) : 0,
    description: dbRecord.description,
    date: new Date(dbRecord.date),
    transactionReference: dbRecord.transactionReference,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all fee costs that the current user has access to
 */
export async function getFeeCosts(fundId?: number, roundId?: number): Promise<FeeCostsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view fee costs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.FEE_COSTS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view fee costs'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      
      // Build query based on user type and optional filters
      const conditions = [];
      
      // Apply filters if provided
      if (fundId) {
        conditions.push(eq(feeCosts.fundId, fundId));
      }
      if (roundId) {
        conditions.push(eq(feeCosts.roundId, roundId));
      }
      
      // For stakeholder users, additional filtering would be needed
      // This depends on how stakeholder access is determined for funds/rounds
      const result = conditions.length > 0 
        ? await db.select().from(feeCosts).where(and(...conditions))
        : await db.select().from(feeCosts);
      
      // Convert database types to schema types
      const typedFeeCosts = result.map(convertToTypedFeeCost);
      
      return {
        success: true,
        data: typedFeeCosts
      };
    } catch (error) {
      console.error('Error fetching fee costs:', error);
      return {
        success: false,
        error: 'Failed to fetch fee costs'
      };
    }
  });
}

/**
 * Get a single fee cost entry by ID
 */
export async function getFeeCost(id: number): Promise<FeeCostResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view fee costs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.FEE_COSTS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this fee cost entry'
        };
      }
      
      const feeCost = await db.query.feeCosts.findFirst({
        where: eq(feeCosts.id, id)
      });
      
      if (!feeCost) {
        return {
          success: false,
          error: 'Fee cost entry not found'
        };
      }
      
      // For stakeholder users, additional access checks would be needed
      // This depends on how stakeholder access is determined for funds/rounds
      
      return {
        success: true,
        data: convertToTypedFeeCost(feeCost)
      };
    } catch (error) {
      console.error('Error fetching fee cost entry:', error);
      return {
        success: false,
        error: 'Failed to fetch fee cost entry'
      };
    }
  });
}

/**
 * Create a new fee cost entry
 */
export async function createFeeCost(data: unknown): Promise<FeeCostResponse> {
  const parsed = CreateFeeCostSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create fee costs
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.FEE_COSTS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create fee cost'
        };
      }
      
      // For stakeholder users, check if they have access to this specific fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access
      
      // Insert fee cost into database
      const [newFeeCost] = await db.insert(feeCosts)
        .values({
          ...parsed.data
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedFeeCost(newFeeCost)
      };
    } catch (error) {
      console.error('Error creating fee cost:', error);
      return {
        success: false,
        error: 'Failed to create fee cost'
      };
    }
  });
}

/**
 * Update a fee cost entry
 */
export async function updateFeeCost(id: number, data: unknown): Promise<FeeCostResponse> {
  const parsed = UpdateFeeCostSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update fee costs
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.FEE_COSTS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update fee cost'
        };
      }
      
      // First, get the existing fee cost to check access
      const existingFeeCost = await db.query.feeCosts.findFirst({
        where: eq(feeCosts.id, id)
      });
      
      if (!existingFeeCost) {
        return {
          success: false,
          error: 'Fee cost entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access
      
      const updateData = {
        ...parsed.data
      };

      const [updatedFeeCost] = await db.update(feeCosts)
        .set(updateData as any)
        .where(eq(feeCosts.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedFeeCost(updatedFeeCost)
      };
    } catch (error) {
      console.error('Error updating fee cost:', error);
      return {
        success: false,
        error: 'Failed to update fee cost'
      };
    }
  });
}

/**
 * Delete a fee cost entry
 */
export async function deleteFeeCost(id: number): Promise<FeeCostResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete fee costs
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.FEE_COSTS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete fee cost'
        };
      }
      
      // First, get the existing fee cost to check access
      const existingFeeCost = await db.query.feeCosts.findFirst({
        where: eq(feeCosts.id, id)
      });
      
      if (!existingFeeCost) {
        return {
          success: false,
          error: 'Fee cost entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access

      const [deletedFeeCost] = await db.delete(feeCosts)
        .where(eq(feeCosts.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedFeeCost(deletedFeeCost)
      };
    } catch (error) {
      console.error('Error deleting fee cost:', error);
      return {
        success: false,
        error: 'Failed to delete fee cost'
      };
    }
  });
}