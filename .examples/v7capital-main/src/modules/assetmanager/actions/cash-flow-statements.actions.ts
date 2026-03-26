'use server';

import { db } from '@database/drizzle';
import { cashFlowStatements } from '@database/drizzle/models/companies';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateCashFlowStatementSchema, 
  UpdateCashFlowStatementSchema,
  type CashFlowStatementResponse,
  type CashFlowStatementsResponse,
  type CashFlowStatement
} from '@/modules/assetmanager/schemas/cash-flow-statements.schemas';

/**
 * Convert database record to typed cash flow statement
 */
function convertToTypedCashFlowStatement(dbRecord: any): CashFlowStatement {
  return {
    ...dbRecord,
    periodStart: dbRecord.periodStart?.toISOString().split('T')[0] || null,
    periodEnd: dbRecord.periodEnd?.toISOString().split('T')[0] || null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all cash flow statements that the current user has access to
 */
export async function getCashFlowStatements(companyId?: number): Promise<CashFlowStatementsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flow statements'
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
          .from(cashFlowStatements)
          .where(eq(cashFlowStatements.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(cashFlowStatements)
          .where(inArray(cashFlowStatements.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(cashFlowStatements);
      }
      
      // Convert database types to schema types
      const typedCashFlowStatements = result.map(convertToTypedCashFlowStatement);
      
      return {
        success: true,
        data: typedCashFlowStatements
      };
    } catch (error) {
      console.error('Error fetching cash flow statements:', error);
      return {
        success: false,
        error: 'Failed to fetch cash flow statements'
      };
    }
  });
}

/**
 * Get a single cash flow statement by ID
 */
export async function getCashFlowStatement(id: number): Promise<CashFlowStatementResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this cash flow statement'
        };
      }
      
      const cashFlowStatement = await db.query.cashFlowStatements.findFirst({
        where: eq(cashFlowStatements.id, id)
      });
      
      if (!cashFlowStatement) {
        return {
          success: false,
          error: 'Cash flow statement not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(cashFlowStatement.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedCashFlowStatement(cashFlowStatement)
      };
    } catch (error) {
      console.error('Error fetching cash flow statement:', error);
      return {
        success: false,
        error: 'Failed to fetch cash flow statement'
      };
    }
  });
}

/**
 * Create a new cash flow statement
 */
export async function createCashFlowStatement(data: unknown): Promise<CashFlowStatementResponse> {
  const parsed = CreateCashFlowStatementSchema.safeParse(data);
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
          error: 'Insufficient permissions to create cash flow statements'
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
      
      // Insert cash flow statement into database
      const [newCashFlowStatement] = await db.insert(cashFlowStatements)
        .values({
          ...parsed.data,
          periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
          periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedCashFlowStatement(newCashFlowStatement)
      };
    } catch (error) {
      console.error('Error creating cash flow statement:', error);
      return {
        success: false,
        error: 'Failed to create cash flow statement'
      };
    }
  });
}

/**
 * Update a cash flow statement
 */
export async function updateCashFlowStatement(id: number, data: unknown): Promise<CashFlowStatementResponse> {
  const parsed = UpdateCashFlowStatementSchema.safeParse(data);
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
          error: 'Insufficient permissions to update cash flow statements'
        };
      }
      
      // First, get the existing cash flow statement to check company access
      const existingCashFlowStatement = await db.query.cashFlowStatements.findFirst({
        where: eq(cashFlowStatements.id, id)
      });
      
      if (!existingCashFlowStatement) {
        return {
          success: false,
          error: 'Cash flow statement not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingCashFlowStatement.companyId)) {
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

      const [updatedCashFlowStatement] = await db.update(cashFlowStatements)
        .set({
          ...parsed.data,
          periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : undefined,
          periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : undefined
        } as any)
        .where(eq(cashFlowStatements.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedCashFlowStatement(updatedCashFlowStatement)
      };
    } catch (error) {
      console.error('Error updating cash flow statement:', error);
      return {
        success: false,
        error: 'Failed to update cash flow statement'
      };
    }
  });
}