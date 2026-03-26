'use server';

import { db } from '@database/drizzle';
import { balanceSheets } from '@database/drizzle/models/companies';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateBalanceSheetSchema, 
  UpdateBalanceSheetSchema,
  type BalanceSheetResponse,
  type BalanceSheetsResponse,
  type BalanceSheet
} from '@/modules/assetmanager/schemas/balance-sheets.schemas';

/**
 * Convert database record to typed balance sheet
 */
function convertToTypedBalanceSheet(dbRecord: any): BalanceSheet {
  return {
    ...dbRecord,
    date: dbRecord.date?.toISOString().split('T')[0] || null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all balance sheets that the current user has access to
 */
export async function getBalanceSheets(companyId?: number): Promise<BalanceSheetsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view balance sheets'
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
          .from(balanceSheets)
          .where(eq(balanceSheets.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(balanceSheets)
          .where(inArray(balanceSheets.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(balanceSheets);
      }
      
      // Convert database types to schema types
      const typedBalanceSheets = result.map(convertToTypedBalanceSheet);
      
      return {
        success: true,
        data: typedBalanceSheets
      };
    } catch (error) {
      console.error('Error fetching balance sheets:', error);
      return {
        success: false,
        error: 'Failed to fetch balance sheets'
      };
    }
  });
}

/**
 * Get a single balance sheet by ID
 */
export async function getBalanceSheet(id: number): Promise<BalanceSheetResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial statements
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this balance sheet'
        };
      }
      
      const balanceSheet = await db.query.balanceSheets.findFirst({
        where: eq(balanceSheets.id, id)
      });
      
      if (!balanceSheet) {
        return {
          success: false,
          error: 'Balance sheet not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(balanceSheet.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedBalanceSheet(balanceSheet)
      };
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return {
        success: false,
        error: 'Failed to fetch balance sheet'
      };
    }
  });
}

/**
 * Create a new balance sheet
 */
export async function createBalanceSheet(data: unknown): Promise<BalanceSheetResponse> {
  const parsed = CreateBalanceSheetSchema.safeParse(data);
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
          error: 'Insufficient permissions to create balance sheets'
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
      
      // Insert balance sheet into database
      const [newBalanceSheet] = await db.insert(balanceSheets)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedBalanceSheet(newBalanceSheet)
      };
    } catch (error) {
      console.error('Error creating balance sheet:', error);
      return {
        success: false,
        error: 'Failed to create balance sheet'
      };
    }
  });
}

/**
 * Update a balance sheet
 */
export async function updateBalanceSheet(id: number, data: unknown): Promise<BalanceSheetResponse> {
  const parsed = UpdateBalanceSheetSchema.safeParse(data);
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
          error: 'Insufficient permissions to update balance sheets'
        };
      }
      
      // First, get the existing balance sheet to check company access
      const existingBalanceSheet = await db.query.balanceSheets.findFirst({
        where: eq(balanceSheets.id, id)
      });
      
      if (!existingBalanceSheet) {
        return {
          success: false,
          error: 'Balance sheet not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingBalanceSheet.companyId)) {
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

      const [updatedBalanceSheet] = await db.update(balanceSheets)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(balanceSheets.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedBalanceSheet(updatedBalanceSheet)
      };
    } catch (error) {
      console.error('Error updating balance sheet:', error);
      return {
        success: false,
        error: 'Failed to update balance sheet'
      };
    }
  });
}

/**
 * Delete a balance sheet
 */
export async function deleteBalanceSheet(id: number): Promise<BalanceSheetResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete financial statements
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete balance sheets'
        };
      }
      
      // First, get the existing balance sheet to check company access
      const existingBalanceSheet = await db.query.balanceSheets.findFirst({
        where: eq(balanceSheets.id, id)
      });
      
      if (!existingBalanceSheet) {
        return {
          success: false,
          error: 'Balance sheet not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingBalanceSheet.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      // Delete the balance sheet
      const [deletedBalanceSheet] = await db.delete(balanceSheets)
        .where(eq(balanceSheets.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedBalanceSheet(deletedBalanceSheet)
      };
    } catch (error) {
      console.error('Error deleting balance sheet:', error);
      return {
        success: false,
        error: 'Failed to delete balance sheet'
      };
    }
  });
}