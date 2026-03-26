'use server';

import { db } from '@database/drizzle';
import { operationalMetrics } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateOperationalMetricsSchema, 
  UpdateOperationalMetricsSchema,
  type OperationalMetricsResponse,
  type OperationalMetricsListResponse,
  type OperationalMetrics,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/operational-metrics.schemas';

/**
 * Convert database record to typed operational metrics
 */
function convertToTypedOperationalMetrics(dbRecord: any): OperationalMetrics {
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
    // Cash metrics
    burnRate: dbRecord.burnRate ? Number(dbRecord.burnRate) : null,
    runwayMonths: dbRecord.runwayMonths ? Number(dbRecord.runwayMonths) : null,
    runwayGross: dbRecord.runwayGross ? Number(dbRecord.runwayGross) : null,
    runwayNet: dbRecord.runwayNet ? Number(dbRecord.runwayNet) : null,
    // Efficiency metrics
    burnMultiple: dbRecord.burnMultiple ? Number(dbRecord.burnMultiple) : null,
    ruleOf40: dbRecord.ruleOf40 ? Number(dbRecord.ruleOf40) : null,
    // Unit economics
    grossMargin: dbRecord.grossMargin ? Number(dbRecord.grossMargin) : null,
    contributionMargin: dbRecord.contributionMargin ? Number(dbRecord.contributionMargin) : null,
    // Productivity metrics
    revenuePerEmployee: dbRecord.revenuePerEmployee ? Number(dbRecord.revenuePerEmployee) : null,
    profitPerEmployee: dbRecord.profitPerEmployee ? Number(dbRecord.profitPerEmployee) : null,
    // Investment metrics
    capitalEfficiency: dbRecord.capitalEfficiency ? Number(dbRecord.capitalEfficiency) : null,
    cashConversionCycle: dbRecord.cashConversionCycle ? Number(dbRecord.cashConversionCycle) : null,
    // Capex / Operating metrics
    capex: dbRecord.capex ? Number(dbRecord.capex) : null,
    ebitda: dbRecord.ebitda ? Number(dbRecord.ebitda) : null,
    totalCosts: dbRecord.totalCosts ? Number(dbRecord.totalCosts) : null,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all operational metrics that the current user has access to
 */
export async function getOperationalMetrics(companyId?: number): Promise<OperationalMetricsListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view operational metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view operational metrics'
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
          .from(operationalMetrics)
          .where(eq(operationalMetrics.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(operationalMetrics)
          .where(inArray(operationalMetrics.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(operationalMetrics);
      }
      
      // Convert database types to schema types
      const typedOperationalMetrics = result.map(convertToTypedOperationalMetrics);
      
      return {
        success: true,
        data: typedOperationalMetrics
      };
    } catch (error) {
      console.error('Error fetching operational metrics:', error);
      return {
        success: false,
        error: 'Failed to fetch operational metrics'
      };
    }
  });
}

/**
 * Get a single operational metrics entry by ID
 */
export async function getOperationalMetric(id: number): Promise<OperationalMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view operational metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this operational metrics entry'
        };
      }
      
      const operationalMetric = await db.query.operationalMetrics.findFirst({
        where: eq(operationalMetrics.id, id)
      });
      
      if (!operationalMetric) {
        return {
          success: false,
          error: 'Operational metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(operationalMetric.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedOperationalMetrics(operationalMetric)
      };
    } catch (error) {
      console.error('Error fetching operational metrics entry:', error);
      return {
        success: false,
        error: 'Failed to fetch operational metrics entry'
      };
    }
  });
}

/**
 * Create a new operational metrics entry
 */
export async function createOperationalMetrics(data: unknown): Promise<OperationalMetricsResponse> {
  const parsed = CreateOperationalMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create operational metrics
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create operational metrics'
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
      
      // Insert operational metrics into database
      const [newOperationalMetrics] = await db.insert(operationalMetrics)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedOperationalMetrics(newOperationalMetrics)
      };
    } catch (error) {
      console.error('Error creating operational metrics:', error);
      return {
        success: false,
        error: 'Failed to create operational metrics'
      };
    }
  });
}

/**
 * Update an operational metrics entry
 */
export async function updateOperationalMetrics(id: number, data: unknown): Promise<OperationalMetricsResponse> {
  const parsed = UpdateOperationalMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update operational metrics
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update operational metrics'
        };
      }
      
      // First, get the existing operational metrics to check company access
      const existingOperationalMetrics = await db.query.operationalMetrics.findFirst({
        where: eq(operationalMetrics.id, id)
      });
      
      if (!existingOperationalMetrics) {
        return {
          success: false,
          error: 'Operational metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingOperationalMetrics.companyId)) {
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

      const [updatedOperationalMetrics] = await db.update(operationalMetrics)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(operationalMetrics.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedOperationalMetrics(updatedOperationalMetrics)
      };
    } catch (error) {
      console.error('Error updating operational metrics:', error);
      return {
        success: false,
        error: 'Failed to update operational metrics'
      };
    }
  });
}

/**
 * Delete an operational metrics entry
 */
export async function deleteOperationalMetrics(id: number): Promise<OperationalMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete operational metrics
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete operational metrics'
        };
      }
      
      // First, get the existing operational metrics to check company access
      const existingOperationalMetrics = await db.query.operationalMetrics.findFirst({
        where: eq(operationalMetrics.id, id)
      });
      
      if (!existingOperationalMetrics) {
        return {
          success: false,
          error: 'Operational metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingOperationalMetrics.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(operationalMetrics)
        .where(eq(operationalMetrics.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting operational metrics:', error);
      return {
        success: false,
        error: 'Failed to delete operational metrics'
      };
    }
  });
}