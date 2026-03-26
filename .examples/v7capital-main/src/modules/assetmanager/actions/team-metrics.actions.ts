'use server';

import { db } from '@database/drizzle';
import { teamMetrics } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateTeamMetricsSchema, 
  UpdateTeamMetricsSchema,
  type TeamMetricsResponse,
  type TeamMetricsListResponse,
  type TeamMetrics,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/team-metrics.schemas';

/**
 * Convert database record to typed team metrics
 */
function convertToTypedTeamMetrics(dbRecord: any): TeamMetrics {
  return {
    id: dbRecord.id,
    companyId: dbRecord.companyId,
    year: dbRecord.year,
    semester: dbRecord.semester,
    quarter: dbRecord.quarter,
    month: dbRecord.month,
    scenario: dbRecord.scenario as FinancialScenario,
    fullYear: dbRecord.fullYear,
    date: dbRecord.date ? (typeof dbRecord.date === 'string' ? dbRecord.date : new Date(dbRecord.date).toISOString().split('T')[0]) : null,
    // Headcount
    totalEmployees: dbRecord.totalEmployees ? Number(dbRecord.totalEmployees) : null,
    fullTimeEmployees: dbRecord.fullTimeEmployees ? Number(dbRecord.fullTimeEmployees) : null,
    partTimeEmployees: dbRecord.partTimeEmployees ? Number(dbRecord.partTimeEmployees) : null,
    contractors: dbRecord.contractors ? Number(dbRecord.contractors) : null,
    // Department breakdown
    numberOfManagement: dbRecord.numberOfManagement ? Number(dbRecord.numberOfManagement) : null,
    numberOfSalesMarketingStaff: dbRecord.numberOfSalesMarketingStaff ? Number(dbRecord.numberOfSalesMarketingStaff) : null,
    numberOfResearchDevelopmentStaff: dbRecord.numberOfResearchDevelopmentStaff ? Number(dbRecord.numberOfResearchDevelopmentStaff) : null,
    numberOfCustomerServiceSupportStaff: dbRecord.numberOfCustomerServiceSupportStaff ? Number(dbRecord.numberOfCustomerServiceSupportStaff) : null,
    numberOfGeneralStaff: dbRecord.numberOfGeneralStaff ? Number(dbRecord.numberOfGeneralStaff) : null,
    // Growth and efficiency
    employeeGrowthRate: dbRecord.employeeGrowthRate ? Number(dbRecord.employeeGrowthRate) : null,
    // Retention and satisfaction
    employeeTurnoverRate: dbRecord.employeeTurnoverRate ? Number(dbRecord.employeeTurnoverRate) : null,
    averageTenureMonths: dbRecord.averageTenureMonths ? Number(dbRecord.averageTenureMonths) : null,
    // Staff costs
    managementCosts: dbRecord.managementCosts ? Number(dbRecord.managementCosts) : null,
    salesMarketingStaffCosts: dbRecord.salesMarketingStaffCosts ? Number(dbRecord.salesMarketingStaffCosts) : null,
    researchDevelopmentStaffCosts: dbRecord.researchDevelopmentStaffCosts ? Number(dbRecord.researchDevelopmentStaffCosts) : null,
    customerServiceSupportStaffCosts: dbRecord.customerServiceSupportStaffCosts ? Number(dbRecord.customerServiceSupportStaffCosts) : null,
    generalStaffCosts: dbRecord.generalStaffCosts ? Number(dbRecord.generalStaffCosts) : null,
    staffCostsTotal: dbRecord.staffCostsTotal ? Number(dbRecord.staffCostsTotal) : null,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all team metrics that the current user has access to
 */
export async function getTeamMetrics(companyId?: number): Promise<TeamMetricsListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view team metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view team metrics'
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
          .from(teamMetrics)
          .where(eq(teamMetrics.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(teamMetrics)
          .where(inArray(teamMetrics.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(teamMetrics);
      }
      
      // Convert database types to schema types
      const typedTeamMetrics = result.map(convertToTypedTeamMetrics);
      
      return {
        success: true,
        data: typedTeamMetrics
      };
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return {
        success: false,
        error: 'Failed to fetch team metrics'
      };
    }
  });
}

/**
 * Get a single team metrics entry by ID
 */
export async function getTeamMetric(id: number): Promise<TeamMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view team metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this team metrics entry'
        };
      }
      
      const teamMetric = await db.query.teamMetrics.findFirst({
        where: eq(teamMetrics.id, id)
      });
      
      if (!teamMetric) {
        return {
          success: false,
          error: 'Team metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(teamMetric.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedTeamMetrics(teamMetric)
      };
    } catch (error) {
      console.error('Error fetching team metrics entry:', error);
      return {
        success: false,
        error: 'Failed to fetch team metrics entry'
      };
    }
  });
}

/**
 * Create a new team metrics entry
 */
export async function createTeamMetrics(data: unknown): Promise<TeamMetricsResponse> {
  const parsed = CreateTeamMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create team metrics
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create team metrics'
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
      
      // Insert team metrics into database
      const [newTeamMetrics] = await db.insert(teamMetrics)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedTeamMetrics(newTeamMetrics)
      };
    } catch (error) {
      console.error('Error creating team metrics:', error);
      return {
        success: false,
        error: 'Failed to create team metrics'
      };
    }
  });
}

/**
 * Update a team metrics entry
 */
export async function updateTeamMetrics(id: number, data: unknown): Promise<TeamMetricsResponse> {
  const parsed = UpdateTeamMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update team metrics
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update team metrics'
        };
      }
      
      // First, get the existing team metrics to check company access
      const existingTeamMetrics = await db.query.teamMetrics.findFirst({
        where: eq(teamMetrics.id, id)
      });
      
      if (!existingTeamMetrics) {
        return {
          success: false,
          error: 'Team metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingTeamMetrics.companyId)) {
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

      const [updatedTeamMetrics] = await db.update(teamMetrics)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(teamMetrics.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedTeamMetrics(updatedTeamMetrics)
      };
    } catch (error) {
      console.error('Error updating team metrics:', error);
      return {
        success: false,
        error: 'Failed to update team metrics'
      };
    }
  });
}

/**
 * Delete a team metrics entry
 */
export async function deleteTeamMetrics(id: number): Promise<TeamMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete team metrics
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete team metrics'
        };
      }
      
      // First, get the existing team metrics to check company access
      const existingTeamMetrics = await db.query.teamMetrics.findFirst({
        where: eq(teamMetrics.id, id)
      });
      
      if (!existingTeamMetrics) {
        return {
          success: false,
          error: 'Team metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingTeamMetrics.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(teamMetrics)
        .where(eq(teamMetrics.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting team metrics:', error);
      return {
        success: false,
        error: 'Failed to delete team metrics'
      };
    }
  });
}