'use server';

import { db } from '@database/drizzle';
import { revenueMetrics } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateRevenueMetricsSchema, 
  UpdateRevenueMetricsSchema,
  type RevenueMetricsResponse,
  type RevenueMetricsListResponse,
  type RevenueMetrics,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/revenue-metrics.schemas';

/**
 * Convert database record to typed revenue metrics
 */
function convertToTypedRevenueMetrics(dbRecord: any): RevenueMetrics {
  return {
    id: dbRecord.id,
    companyId: dbRecord.companyId,
    year: dbRecord.year,
    semester: dbRecord.semester,
    quarter: dbRecord.quarter,
    month: dbRecord.month,
    scenario: dbRecord.scenario as FinancialScenario,
    fullYear: dbRecord.fullYear,
    date: dbRecord.date?.toISOString().split('T')[0] || null,
    // Core revenue metrics
    recurringRevenue: dbRecord.recurringRevenue ? Number(dbRecord.recurringRevenue) : null,
    nonRecurringRevenue: dbRecord.nonRecurringRevenue ? Number(dbRecord.nonRecurringRevenue) : null,
    revenueGrowthRate: dbRecord.revenueGrowthRate ? Number(dbRecord.revenueGrowthRate) : null,
    // Revenue breakdown
    existingCustomerExistingSeatsRevenue: dbRecord.existingCustomerExistingSeatsRevenue ? Number(dbRecord.existingCustomerExistingSeatsRevenue) : null,
    existingCustomerAdditionalSeatsRevenue: dbRecord.existingCustomerAdditionalSeatsRevenue ? Number(dbRecord.existingCustomerAdditionalSeatsRevenue) : null,
    newCustomerNewSeatsRevenue: dbRecord.newCustomerNewSeatsRevenue ? Number(dbRecord.newCustomerNewSeatsRevenue) : null,
    discountsAndRefunds: dbRecord.discountsAndRefunds ? Number(dbRecord.discountsAndRefunds) : null,
    // SaaS-specific metrics
    arr: dbRecord.arr ? Number(dbRecord.arr) : null,
    mrr: dbRecord.mrr ? Number(dbRecord.mrr) : null,
    // Per customer metrics
    averageRevenuePerCustomer: dbRecord.averageRevenuePerCustomer ? Number(dbRecord.averageRevenuePerCustomer) : null,
    averageContractValue: dbRecord.averageContractValue ? Number(dbRecord.averageContractValue) : null,
    // Retention metrics
    revenueChurnRate: dbRecord.revenueChurnRate ? Number(dbRecord.revenueChurnRate) : null,
    netRevenueRetention: dbRecord.netRevenueRetention ? Number(dbRecord.netRevenueRetention) : null,
    grossRevenueRetention: dbRecord.grossRevenueRetention ? Number(dbRecord.grossRevenueRetention) : null,
    // Cohort growth rates
    growthRateCohort1: dbRecord.growthRateCohort1 ? Number(dbRecord.growthRateCohort1) : null,
    growthRateCohort2: dbRecord.growthRateCohort2 ? Number(dbRecord.growthRateCohort2) : null,
    growthRateCohort3: dbRecord.growthRateCohort3 ? Number(dbRecord.growthRateCohort3) : null,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all revenue metrics that the current user has access to
 */
export async function getRevenueMetrics(companyId?: number): Promise<RevenueMetricsListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view revenue metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view revenue metrics'
        };
      }
      
      // Get company IDs for filtering (if applicable)
      const companyIds = await getCompanyIds(profile);
      
      // Build query based on user type and optional companyId filter
      let result: any[];
      
      if (companyId) {
        // Specific company requested - check access
        if (companyIds.length > 0 && !companyIds.includes(companyId)) {
          return {
            success: false,
            error: 'Forbidden: You do not have access to this company'
          };
        }
        result = await db.select()
          .from(revenueMetrics)
          .where(eq(revenueMetrics.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(revenueMetrics)
          .where(inArray(revenueMetrics.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(revenueMetrics);
      }
      
      // Convert database types to schema types
      const typedRevenueMetrics = result.map(convertToTypedRevenueMetrics);
      
      return {
        success: true,
        data: typedRevenueMetrics
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        success: false,
        error: 'Failed to fetch revenue metrics'
      };
    }
  });
}

/**
 * Get a single revenue metrics entry by ID
 */
export async function getRevenueMetric(id: number): Promise<RevenueMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view revenue metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this revenue metrics entry'
        };
      }
      
      const revenueMetric = await db.query.revenueMetrics.findFirst({
        where: eq(revenueMetrics.id, id)
      });
      
      if (!revenueMetric) {
        return {
          success: false,
          error: 'Revenue metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(revenueMetric.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedRevenueMetrics(revenueMetric)
      };
    } catch (error) {
      console.error('Error fetching revenue metrics entry:', error);
      return {
        success: false,
        error: 'Failed to fetch revenue metrics entry'
      };
    }
  });
}

/**
 * Create a new revenue metrics entry
 */
export async function createRevenueMetrics(data: unknown): Promise<RevenueMetricsResponse> {
  const parsed = CreateRevenueMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create revenue metrics
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create revenue metrics'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Insert revenue metrics into database
      const [newRevenueMetrics] = await db.insert(revenueMetrics)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedRevenueMetrics(newRevenueMetrics)
      };
    } catch (error) {
      console.error('Error creating revenue metrics:', error);
      return {
        success: false,
        error: 'Failed to create revenue metrics'
      };
    }
  });
}

/**
 * Update a revenue metrics entry
 */
export async function updateRevenueMetrics(id: number, data: unknown): Promise<RevenueMetricsResponse> {
  const parsed = UpdateRevenueMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update revenue metrics
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update revenue metrics'
        };
      }
      
      // First, get the existing revenue metrics to check company access
      const existingRevenueMetrics = await db.query.revenueMetrics.findFirst({
        where: eq(revenueMetrics.id, id)
      });
      
      if (!existingRevenueMetrics) {
        return {
          success: false,
          error: 'Revenue metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingRevenueMetrics.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // If companyId is being changed, verify access to new company
      if (parsed.data.companyId && companyIds.length > 0 && !companyIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to the target company'
        };
      }

      const [updatedRevenueMetrics] = await db.update(revenueMetrics)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(revenueMetrics.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedRevenueMetrics(updatedRevenueMetrics)
      };
    } catch (error) {
      console.error('Error updating revenue metrics:', error);
      return {
        success: false,
        error: 'Failed to update revenue metrics'
      };
    }
  });
}

/**
 * Delete a revenue metrics entry
 */
export async function deleteRevenueMetrics(id: number): Promise<RevenueMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete revenue metrics
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete revenue metrics'
        };
      }
      
      // First, get the existing revenue metrics to check company access
      const existingRevenueMetrics = await db.query.revenueMetrics.findFirst({
        where: eq(revenueMetrics.id, id)
      });
      
      if (!existingRevenueMetrics) {
        return {
          success: false,
          error: 'Revenue metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingRevenueMetrics.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(revenueMetrics)
        .where(eq(revenueMetrics.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting revenue metrics:', error);
      return {
        success: false,
        error: 'Failed to delete revenue metrics'
      };
    }
  });
}