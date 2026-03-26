'use server';

import { db } from '@database/drizzle';
import { customerMetrics } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateCustomerMetricsSchema, 
  UpdateCustomerMetricsSchema,
  type CustomerMetricsResponse,
  type CustomerMetricsListResponse,
  type CustomerMetrics,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/customer-metrics.schemas';

/**
 * Convert database record to typed customer metrics
 */
function convertToTypedCustomerMetrics(dbRecord: any): CustomerMetrics {
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
    // Customer counts
    totalCustomers: dbRecord.totalCustomers ? Number(dbRecord.totalCustomers) : null,
    newCustomers: dbRecord.newCustomers ? Number(dbRecord.newCustomers) : null,
    churnedCustomers: dbRecord.churnedCustomers ? Number(dbRecord.churnedCustomers) : null,
    // User metrics
    totalUsers: dbRecord.totalUsers ? Number(dbRecord.totalUsers) : null,
    activeUsers: dbRecord.activeUsers ? Number(dbRecord.activeUsers) : null,
    totalMonthlyActiveClientUsers: dbRecord.totalMonthlyActiveClientUsers ? Number(dbRecord.totalMonthlyActiveClientUsers) : null,
    // User breakdown
    existingCustomerExistingSeatsUsers: dbRecord.existingCustomerExistingSeatsUsers ? Number(dbRecord.existingCustomerExistingSeatsUsers) : null,
    existingCustomerAdditionalSeatsUsers: dbRecord.existingCustomerAdditionalSeatsUsers ? Number(dbRecord.existingCustomerAdditionalSeatsUsers) : null,
    newCustomerNewSeatsUsers: dbRecord.newCustomerNewSeatsUsers ? Number(dbRecord.newCustomerNewSeatsUsers) : null,
    userGrowthRate: dbRecord.userGrowthRate ? Number(dbRecord.userGrowthRate) : null,
    // Addressable market metrics
    newCustomerTotalAddressableSeats: dbRecord.newCustomerTotalAddressableSeats ? Number(dbRecord.newCustomerTotalAddressableSeats) : null,
    newCustomerNewSeatsPercentSigned: dbRecord.newCustomerNewSeatsPercentSigned ? Number(dbRecord.newCustomerNewSeatsPercentSigned) : null,
    newCustomerTotalAddressableSeatsRemaining: dbRecord.newCustomerTotalAddressableSeatsRemaining ? Number(dbRecord.newCustomerTotalAddressableSeatsRemaining) : null,
    // Customer segments
    existingCustomerCount: dbRecord.existingCustomerCount ? Number(dbRecord.existingCustomerCount) : null,
    existingCustomerExpansionCount: dbRecord.existingCustomerExpansionCount ? Number(dbRecord.existingCustomerExpansionCount) : null,
    newCustomerCount: dbRecord.newCustomerCount ? Number(dbRecord.newCustomerCount) : null,
    // Growth metrics
    customerGrowthRate: dbRecord.customerGrowthRate ? Number(dbRecord.customerGrowthRate) : null,
    // Customer acquisition
    cac: dbRecord.cac ? Number(dbRecord.cac) : null,
    ltv: dbRecord.ltv ? Number(dbRecord.ltv) : null,
    ltvCacRatio: dbRecord.ltvCacRatio ? Number(dbRecord.ltvCacRatio) : null,
    paybackPeriod: dbRecord.paybackPeriod ? Number(dbRecord.paybackPeriod) : null,
    // Retention metrics
    customerChurnRate: dbRecord.customerChurnRate ? Number(dbRecord.customerChurnRate) : null,
    // Efficiency metrics
    customerAcquisitionEfficiency: dbRecord.customerAcquisitionEfficiency ? Number(dbRecord.customerAcquisitionEfficiency) : null,
    salesEfficiency: dbRecord.salesEfficiency ? Number(dbRecord.salesEfficiency) : null,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all customer metrics that the current user has access to
 */
export async function getCustomerMetrics(companyId?: number): Promise<CustomerMetricsListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view customer metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view customer metrics'
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
          .from(customerMetrics)
          .where(eq(customerMetrics.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(customerMetrics)
          .where(inArray(customerMetrics.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(customerMetrics);
      }
      
      // Convert database types to schema types
      const typedCustomerMetrics = result.map(convertToTypedCustomerMetrics);
      
      return {
        success: true,
        data: typedCustomerMetrics
      };
    } catch (error) {
      console.error('Error fetching customer metrics:', error);
      return {
        success: false,
        error: 'Failed to fetch customer metrics'
      };
    }
  });
}

/**
 * Get a single customer metrics entry by ID
 */
export async function getCustomerMetric(id: number): Promise<CustomerMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view customer metrics
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this customer metrics entry'
        };
      }
      
      const customerMetric = await db.query.customerMetrics.findFirst({
        where: eq(customerMetrics.id, id)
      });
      
      if (!customerMetric) {
        return {
          success: false,
          error: 'Customer metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(customerMetric.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedCustomerMetrics(customerMetric)
      };
    } catch (error) {
      console.error('Error fetching customer metrics entry:', error);
      return {
        success: false,
        error: 'Failed to fetch customer metrics entry'
      };
    }
  });
}

/**
 * Create a new customer metrics entry
 */
export async function createCustomerMetrics(data: unknown): Promise<CustomerMetricsResponse> {
  const parsed = CreateCustomerMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create customer metrics
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create customer metrics'
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
      
      // Insert customer metrics into database
      const [newCustomerMetrics] = await db.insert(customerMetrics)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedCustomerMetrics(newCustomerMetrics)
      };
    } catch (error) {
      console.error('Error creating customer metrics:', error);
      return {
        success: false,
        error: 'Failed to create customer metrics'
      };
    }
  });
}

/**
 * Update a customer metrics entry
 */
export async function updateCustomerMetrics(id: number, data: unknown): Promise<CustomerMetricsResponse> {
  const parsed = UpdateCustomerMetricsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update customer metrics
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update customer metrics'
        };
      }
      
      // First, get the existing customer metrics to check company access
      const existingCustomerMetrics = await db.query.customerMetrics.findFirst({
        where: eq(customerMetrics.id, id)
      });
      
      if (!existingCustomerMetrics) {
        return {
          success: false,
          error: 'Customer metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingCustomerMetrics.companyId)) {
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

      const [updatedCustomerMetrics] = await db.update(customerMetrics)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(customerMetrics.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedCustomerMetrics(updatedCustomerMetrics)
      };
    } catch (error) {
      console.error('Error updating customer metrics:', error);
      return {
        success: false,
        error: 'Failed to update customer metrics'
      };
    }
  });
}

/**
 * Delete a customer metrics entry
 */
export async function deleteCustomerMetrics(id: number): Promise<CustomerMetricsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete customer metrics
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete customer metrics'
        };
      }
      
      // First, get the existing customer metrics to check company access
      const existingCustomerMetrics = await db.query.customerMetrics.findFirst({
        where: eq(customerMetrics.id, id)
      });
      
      if (!existingCustomerMetrics) {
        return {
          success: false,
          error: 'Customer metrics entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingCustomerMetrics.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(customerMetrics)
        .where(eq(customerMetrics.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting customer metrics:', error);
      return {
        success: false,
        error: 'Failed to delete customer metrics'
      };
    }
  });
}