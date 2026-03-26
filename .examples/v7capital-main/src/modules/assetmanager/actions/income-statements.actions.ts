'use server';

import { db } from '@database/drizzle';
import { incomeStatements } from '@database/drizzle/models/companies';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateIncomeStatementSchema, 
  UpdateIncomeStatementSchema,
  type IncomeStatementResponse,
  type IncomeStatementsResponse,
  type IncomeStatement
} from '@/modules/assetmanager/schemas/income-statements.schemas';

/**
 * Safely convert date to ISO date string
 */
function toDateString(date: any): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Convert database record to typed income statement
 */
function convertToTypedIncomeStatement(dbRecord: any): IncomeStatement {
  return {
    ...dbRecord,
    periodStart: toDateString(dbRecord.periodStart),
    periodEnd: toDateString(dbRecord.periodEnd),
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all income statements that the current user has access to
 */
export async function getIncomeStatements(companyId?: number): Promise<IncomeStatementsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view income statements'
        };
      }
      
      // Get company IDs for filtering (if applicable)
      const companyIds = await getCompanyIds(profile);
      
      // Build query based on user type and optional companyId filter
      let result;
      
      if (companyId) {
        // Specific company requested - check access
        if (companyIds.length > 0 && !companyIds.includes(companyId)) {
          return {
            success: false,
            error: 'Forbidden: You do not have access to this company'
          };
        }
        result = await db.select()
          .from(incomeStatements)
          .where(eq(incomeStatements.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(incomeStatements)
          .where(inArray(incomeStatements.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(incomeStatements);
      }
      
      // Convert database types to schema types
      const typedIncomeStatements = result.map(convertToTypedIncomeStatement);
      
      return {
        success: true,
        data: typedIncomeStatements
      };
    } catch (error) {
      console.error('Error fetching income statements:', error);
      return {
        success: false,
        error: 'Failed to fetch income statements'
      };
    }
  });
}

/**
 * Get a single income statement by ID
 */
export async function getIncomeStatement(id: number): Promise<IncomeStatementResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this income statement'
        };
      }
      
      const incomeStatement = await db.query.incomeStatements.findFirst({
        where: eq(incomeStatements.id, id)
      });
      
      if (!incomeStatement) {
        return {
          success: false,
          error: 'Income statement not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(incomeStatement.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedIncomeStatement(incomeStatement)
      };
    } catch (error) {
      console.error('Error fetching income statement:', error);
      return {
        success: false,
        error: 'Failed to fetch income statement'
      };
    }
  });
}

/**
 * Create a new income statement
 */
export async function createIncomeStatement(data: unknown): Promise<IncomeStatementResponse> {
  const parsed = CreateIncomeStatementSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create financial statements
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create income statements'
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
      
      // Insert income statement into database
      const [newIncomeStatement] = await db.insert(incomeStatements)
        .values({
          ...parsed.data,
          periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
          periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedIncomeStatement(newIncomeStatement)
      };
    } catch (error) {
      console.error('Error creating income statement:', error);
      return {
        success: false,
        error: 'Failed to create income statement'
      };
    }
  });
}

/**
 * Update an income statement
 */
export async function updateIncomeStatement(id: number, data: unknown): Promise<IncomeStatementResponse> {
  const parsed = UpdateIncomeStatementSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update financial statements
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update income statements'
        };
      }
      
      // First, get the existing income statement to check company access
      const existingIncomeStatement = await db.query.incomeStatements.findFirst({
        where: eq(incomeStatements.id, id)
      });
      
      if (!existingIncomeStatement) {
        return {
          success: false,
          error: 'Income statement not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingIncomeStatement.companyId)) {
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

      const [updatedIncomeStatement] = await db.update(incomeStatements)
        .set({
          ...parsed.data,
          periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : undefined,
          periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : undefined
        } as any)
        .where(eq(incomeStatements.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedIncomeStatement(updatedIncomeStatement)
      };
    } catch (error) {
      console.error('Error updating income statement:', error);
      return {
        success: false,
        error: 'Failed to update income statement'
      };
    }
  });
}