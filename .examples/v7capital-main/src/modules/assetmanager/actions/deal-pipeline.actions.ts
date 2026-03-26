'use server';

import { db } from '@database/drizzle';
import { dealPipeline } from '@database/drizzle/models/portfolio';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateDealPipelineSchema, 
  UpdateDealPipelineSchema,
  type DealPipelineResponse,
  type DealPipelinesResponse,
  type DealPipeline,
  type DealPriority,
  type DealStatus,
  type SectorType
} from '@/modules/assetmanager/schemas/deal-pipeline.schemas';

/**
 * Convert database record to typed deal pipeline
 */
function convertToTypedDealPipeline(dbRecord: any): DealPipeline {
  return {
    id: dbRecord.id,
    companyId: dbRecord.companyId,
    dealName: dbRecord.dealName,
    priority: dbRecord.priority as DealPriority,
    status: dbRecord.status as DealStatus,
    round: dbRecord.round,
    sector: dbRecord.sector as SectorType,
    preMoneyValuation: dbRecord.preMoneyValuation ? Number(dbRecord.preMoneyValuation) : null,
    postMoneyValuation: dbRecord.postMoneyValuation ? Number(dbRecord.postMoneyValuation) : null,
    rejectionReason: dbRecord.rejectionReason,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all deal pipeline entries that the current user has access to
 */
export async function getDealPipelines(companyId?: number): Promise<DealPipelinesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view deal pipeline
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.DEAL_PIPELINE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view deal pipeline'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getCompanyIds(profile);
      
      // Build query based on user type and optional companyId filter
      let result: any[];
      
      if (companyId) {
        // Specific company requested - check access
        if (stakeholderIds.length > 0 && !stakeholderIds.includes(companyId)) {
          return {
            success: false,
            error: 'Forbidden: You do not have access to this company'
          };
        }
        result = await db.select()
          .from(dealPipeline)
          .where(eq(dealPipeline.companyId, companyId));
      } else if (stakeholderIds.length > 0) {
        // For stakeholder users - filter by their company IDs
        result = await db.select()
          .from(dealPipeline)
          .where(inArray(dealPipeline.companyId, stakeholderIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(dealPipeline);
      }
      
      // Convert database types to schema types
      const typedDealPipelines = result.map(convertToTypedDealPipeline);
      
      return {
        success: true,
        data: typedDealPipelines
      };
    } catch (error) {
      console.error('Error fetching deal pipelines:', error);
      return {
        success: false,
        error: 'Failed to fetch deal pipelines'
      };
    }
  });
}

/**
 * Get a single deal pipeline entry by ID
 */
export async function getDealPipeline(id: number): Promise<DealPipelineResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view deal pipeline
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.DEAL_PIPELINE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this deal pipeline entry'
        };
      }
      
      const dealPipelineEntry = await db.query.dealPipeline.findFirst({
        where: eq(dealPipeline.id, id)
      });
      
      if (!dealPipelineEntry) {
        return {
          success: false,
          error: 'Deal pipeline entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this company
      const stakeholderIds = await getCompanyIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(dealPipelineEntry.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedDealPipeline(dealPipelineEntry)
      };
    } catch (error) {
      console.error('Error fetching deal pipeline entry:', error);
      return {
        success: false,
        error: 'Failed to fetch deal pipeline entry'
      };
    }
  });
}

/**
 * Create a new deal pipeline entry
 */
export async function createDealPipeline(data: unknown): Promise<DealPipelineResponse> {
  const parsed = CreateDealPipelineSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create deal pipeline
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.DEAL_PIPELINE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create deal pipeline'
        };
      }
      
      // For stakeholder users, check if they have access to this specific company
      const stakeholderIds = await getCompanyIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Insert deal pipeline into database
      const [newDealPipeline] = await db.insert(dealPipeline)
        .values(parsed.data as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedDealPipeline(newDealPipeline)
      };
    } catch (error) {
      console.error('Error creating deal pipeline:', error);
      return {
        success: false,
        error: 'Failed to create deal pipeline'
      };
    }
  });
}

/**
 * Update a deal pipeline entry
 */
export async function updateDealPipeline(id: number, data: unknown): Promise<DealPipelineResponse> {
  const parsed = UpdateDealPipelineSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update deal pipeline
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.DEAL_PIPELINE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update deal pipeline'
        };
      }
      
      // First, get the existing deal pipeline to check company access
      const existingDealPipeline = await db.query.dealPipeline.findFirst({
        where: eq(dealPipeline.id, id)
      });
      
      if (!existingDealPipeline) {
        return {
          success: false,
          error: 'Deal pipeline entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this company
      const stakeholderIds = await getCompanyIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(existingDealPipeline.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // If companyId is being changed, verify access to new company
      if (parsed.data.companyId && stakeholderIds.length > 0 && !stakeholderIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to the target company'
        };
      }

      const [updatedDealPipeline] = await db.update(dealPipeline)
        .set(parsed.data as any)
        .where(eq(dealPipeline.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedDealPipeline(updatedDealPipeline)
      };
    } catch (error) {
      console.error('Error updating deal pipeline:', error);
      return {
        success: false,
        error: 'Failed to update deal pipeline'
      };
    }
  });
}

/**
 * Delete a deal pipeline entry
 */
export async function deleteDealPipeline(id: number): Promise<DealPipelineResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete deal pipeline
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.DEAL_PIPELINE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete deal pipeline'
        };
      }
      
      // First, get the existing deal pipeline to check company access
      const existingDealPipeline = await db.query.dealPipeline.findFirst({
        where: eq(dealPipeline.id, id)
      });
      
      if (!existingDealPipeline) {
        return {
          success: false,
          error: 'Deal pipeline entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this company
      const stakeholderIds = await getCompanyIds(profile);
      if (stakeholderIds.length > 0 && !stakeholderIds.includes(existingDealPipeline.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      const [deletedDealPipeline] = await db.delete(dealPipeline)
        .where(eq(dealPipeline.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedDealPipeline(deletedDealPipeline)
      };
    } catch (error) {
      console.error('Error deleting deal pipeline:', error);
      return {
        success: false,
        error: 'Failed to delete deal pipeline'
      };
    }
  });
}