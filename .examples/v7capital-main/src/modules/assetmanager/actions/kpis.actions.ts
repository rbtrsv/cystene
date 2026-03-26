'use server';

import { db } from '@database/drizzle';
import { kpis, kpiValues } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateKpiSchema, 
  UpdateKpiSchema,
  CreateKpiValueSchema,
  UpdateKpiValueSchema,
  type KpiResponse,
  type KpisResponse,
  type KpiValueResponse,
  type KpiValuesResponse,
  type KpiValuesWithRelationsResponse,
  type KpiValueWithRelationsResponse,
  type Kpi,
  type KpiValue,
  type KpiValueWithRelations,
  type KpiDataType,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/kpis.schemas';

/**
 * Safely convert date to ISO date string
 */
function toDateString(date: any): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Convert database record to typed KPI
 */
function convertToTypedKpi(dbRecord: any): Kpi {
  return {
    id: dbRecord.id,
    companyId: dbRecord.companyId,
    name: dbRecord.name,
    description: dbRecord.description,
    dataType: dbRecord.dataType as KpiDataType,
    isCalculated: dbRecord.isCalculated,
    formula: dbRecord.formula,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Convert database record to typed KPI Value
 */
function convertToTypedKpiValue(dbRecord: any): KpiValue {
  return {
    id: dbRecord.id,
    kpiId: dbRecord.kpiId,
    date: toDateString(dbRecord.date) || '',
    year: dbRecord.year,
    semester: dbRecord.semester,
    quarter: dbRecord.quarter,
    month: dbRecord.month,
    fullYear: dbRecord.fullYear,
    scenario: dbRecord.scenario as FinancialScenario,
    value: dbRecord.value ? Number(dbRecord.value) : null,
    calculatedAt: dbRecord.calculatedAt ? new Date(dbRecord.calculatedAt) : null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all KPIs that the current user has access to
 */
export async function getKpis(companyId?: number): Promise<KpisResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view KPIs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view KPIs'
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
          .from(kpis)
          .where(eq(kpis.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(kpis)
          .where(inArray(kpis.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(kpis);
      }
      
      // Convert database types to schema types
      const typedKpis = result.map(convertToTypedKpi);
      
      return {
        success: true,
        data: typedKpis
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return {
        success: false,
        error: 'Failed to fetch KPIs'
      };
    }
  });
}

/**
 * Get a single KPI by ID
 */
export async function getKpi(id: number): Promise<KpiResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view KPIs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this KPI'
        };
      }
      
      const kpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, id)
      });
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedKpi(kpi)
      };
    } catch (error) {
      console.error('Error fetching KPI:', error);
      return {
        success: false,
        error: 'Failed to fetch KPI'
      };
    }
  });
}

/**
 * Create a new KPI
 */
export async function createKpi(data: unknown): Promise<KpiResponse> {
  const parsed = CreateKpiSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create KPIs
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create KPIs'
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
      
      // Insert KPI into database
      const [newKpi] = await db.insert(kpis)
        .values({
          ...parsed.data
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedKpi(newKpi)
      };
    } catch (error) {
      console.error('Error creating KPI:', error);
      return {
        success: false,
        error: 'Failed to create KPI'
      };
    }
  });
}

/**
 * Update a KPI
 */
export async function updateKpi(id: number, data: unknown): Promise<KpiResponse> {
  const parsed = UpdateKpiSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update KPIs
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update KPIs'
        };
      }
      
      // First, get the existing KPI to check company access
      const existingKpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, id)
      });
      
      if (!existingKpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingKpi.companyId)) {
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

      const [updatedKpi] = await db.update(kpis)
        .set({
          ...parsed.data
        } as any)
        .where(eq(kpis.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedKpi(updatedKpi)
      };
    } catch (error) {
      console.error('Error updating KPI:', error);
      return {
        success: false,
        error: 'Failed to update KPI'
      };
    }
  });
}

/**
 * Delete a KPI entry
 */
export async function deleteKpi(id: number): Promise<KpiResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete KPIs
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete KPI'
        };
      }
      
      // First, get the existing KPI to check company access
      const existingKpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, id)
      });
      
      if (!existingKpi) {
        return {
          success: false,
          error: 'KPI entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingKpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(kpis)
        .where(eq(kpis.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting KPI:', error);
      return {
        success: false,
        error: 'Failed to delete KPI'
      };
    }
  });
}

/**
 * Get all KPI values that the current user has access to
 */
export async function getAllKpiValues(companyId?: number): Promise<KpiValuesWithRelationsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view KPIs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view KPI values'
        };
      }
      
      // Get accessible company IDs for filtering
      const companyIds = await getCompanyIds(profile);
      
      // Build query with company filtering
      let result;
      
      if (companyId) {
        // Filter by specific company if requested
        if (companyIds.length > 0 && !companyIds.includes(companyId)) {
          return {
            success: false,
            error: 'Forbidden: You do not have access to this company'
          };
        }
        result = await db.select()
          .from(kpiValues)
          .leftJoin(kpis, eq(kpiValues.kpiId, kpis.id))
          .where(eq(kpis.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users, filter by accessible companies
        result = await db.select()
          .from(kpiValues)
          .leftJoin(kpis, eq(kpiValues.kpiId, kpis.id))
          .where(inArray(kpis.companyId, companyIds));
      } else {
        // No filtering needed - admin/global users
        result = await db.select()
          .from(kpiValues)
          .leftJoin(kpis, eq(kpiValues.kpiId, kpis.id));
      }
      
      // Convert and merge the joined data
      const typedKpiValues = result.map(row => {
        const kpiValue = convertToTypedKpiValue(row.kpi_values);
        return {
          ...kpiValue,
          kpi: row.kpis ? convertToTypedKpi(row.kpis) : null
        };
      });
      
      return {
        success: true,
        data: typedKpiValues
      };
    } catch (error) {
      console.error('Error fetching all KPI values:', error);
      return {
        success: false,
        error: 'Failed to fetch KPI values'
      };
    }
  });
}

/**
 * Get all KPI values for a specific KPI
 */
export async function getKpiValues(kpiId: number): Promise<KpiValuesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view KPIs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view KPI values'
        };
      }
      
      // First check if user has access to the KPI
      const kpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, kpiId)
      });
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      const result = await db.select()
        .from(kpiValues)
        .where(eq(kpiValues.kpiId, kpiId));
      
      // Convert database types to schema types
      const typedKpiValues = result.map(convertToTypedKpiValue);
      
      return {
        success: true,
        data: typedKpiValues
      };
    } catch (error) {
      console.error('Error fetching KPI values:', error);
      return {
        success: false,
        error: 'Failed to fetch KPI values'
      };
    }
  });
}

/**
 * Get a single KPI value by ID
 */
export async function getKpiValue(id: number): Promise<KpiValueWithRelationsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view KPIs
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this KPI value'
        };
      }
      
      const result = await db.select()
        .from(kpiValues)
        .leftJoin(kpis, eq(kpiValues.kpiId, kpis.id))
        .where(eq(kpiValues.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return {
          success: false,
          error: 'KPI value not found'
        };
      }
      
      const row = result[0];
      const kpiValue = row.kpi_values;
      const kpi = row.kpis;
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: {
          ...convertToTypedKpiValue(kpiValue),
          kpi: convertToTypedKpi(kpi)
        }
      };
    } catch (error) {
      console.error('Error fetching KPI value:', error);
      return {
        success: false,
        error: 'Failed to fetch KPI value'
      };
    }
  });
}

/**
 * Create a new KPI value
 */
export async function createKpiValue(data: unknown): Promise<KpiValueResponse> {
  const parsed = CreateKpiValueSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create KPIs
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create KPI values'
        };
      }
      
      // Check if user has access to the KPI
      const kpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, parsed.data.kpiId)
      });
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Insert KPI value into database
      const [newKpiValue] = await db.insert(kpiValues)
        .values({
          ...parsed.data,
          date: new Date(parsed.data.date),
          calculatedAt: parsed.data.calculatedAt ? new Date(parsed.data.calculatedAt) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedKpiValue(newKpiValue)
      };
    } catch (error) {
      console.error('Error creating KPI value:', error);
      
      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        if ('constraint' in error && error.constraint === 'unique_kpi_value') {
          return {
            success: false,
            error: 'A KPI value already exists for this KPI, date, and scenario combination. Please use a different date or scenario, or edit the existing value.'
          };
        }
      }
      
      return {
        success: false,
        error: 'Failed to create KPI value'
      };
    }
  });
}

/**
 * Update a KPI value
 */
export async function updateKpiValue(id: number, data: unknown): Promise<KpiValueResponse> {
  const parsed = UpdateKpiValueSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update KPIs
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update KPI values'
        };
      }
      
      // First, get the existing KPI value
      const existingKpiValue = await db.query.kpiValues.findFirst({
        where: eq(kpiValues.id, id)
      });
      
      if (!existingKpiValue) {
        return {
          success: false,
          error: 'KPI value not found'
        };
      }
      
      // Check if user has access to the KPI
      const kpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, existingKpiValue.kpiId)
      });
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      const [updatedKpiValue] = await db.update(kpiValues)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined,
          calculatedAt: parsed.data.calculatedAt ? new Date(parsed.data.calculatedAt) : undefined
        } as any)
        .where(eq(kpiValues.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedKpiValue(updatedKpiValue)
      };
    } catch (error) {
      console.error('Error updating KPI value:', error);
      return {
        success: false,
        error: 'Failed to update KPI value'
      };
    }
  });
}

/**
 * Delete a KPI value
 */
export async function deleteKpiValue(id: number): Promise<KpiValueResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete KPIs
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete KPI value'
        };
      }
      
      // First, get the existing KPI value
      const existingKpiValue = await db.query.kpiValues.findFirst({
        where: eq(kpiValues.id, id)
      });
      
      if (!existingKpiValue) {
        return {
          success: false,
          error: 'KPI value not found'
        };
      }
      
      // Check if user has access to the KPI
      const kpi = await db.query.kpis.findFirst({
        where: eq(kpis.id, existingKpiValue.kpiId)
      });
      
      if (!kpi) {
        return {
          success: false,
          error: 'KPI not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(kpi.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(kpiValues)
        .where(eq(kpiValues.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting KPI value:', error);
      return {
        success: false,
        error: 'Failed to delete KPI value'
      };
    }
  });
}