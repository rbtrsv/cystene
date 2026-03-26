'use server';

import { db } from '@database/drizzle';
import { financialRatios } from '@database/drizzle/models/companies';
import { eq, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateFinancialRatiosSchema, 
  UpdateFinancialRatiosSchema,
  type FinancialRatiosResponse,
  type FinancialRatiosListResponse,
  type FinancialRatios,
  type FinancialScenario
} from '@/modules/assetmanager/schemas/financial-ratios.schemas';

/**
 * Convert database record to typed financial ratios
 */
function convertToTypedFinancialRatios(dbRecord: any): FinancialRatios {
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
    // Liquidity ratios
    currentRatio: dbRecord.currentRatio ? Number(dbRecord.currentRatio) : null,
    quickRatio: dbRecord.quickRatio ? Number(dbRecord.quickRatio) : null,
    cashRatio: dbRecord.cashRatio ? Number(dbRecord.cashRatio) : null,
    operatingCashFlowRatio: dbRecord.operatingCashFlowRatio ? Number(dbRecord.operatingCashFlowRatio) : null,
    // Solvency ratios
    debtToEquityRatio: dbRecord.debtToEquityRatio ? Number(dbRecord.debtToEquityRatio) : null,
    debtToAssetsRatio: dbRecord.debtToAssetsRatio ? Number(dbRecord.debtToAssetsRatio) : null,
    interestCoverageRatio: dbRecord.interestCoverageRatio ? Number(dbRecord.interestCoverageRatio) : null,
    debtServiceCoverageRatio: dbRecord.debtServiceCoverageRatio ? Number(dbRecord.debtServiceCoverageRatio) : null,
    // Profitability ratios
    grossProfitMargin: dbRecord.grossProfitMargin ? Number(dbRecord.grossProfitMargin) : null,
    operatingProfitMargin: dbRecord.operatingProfitMargin ? Number(dbRecord.operatingProfitMargin) : null,
    netProfitMargin: dbRecord.netProfitMargin ? Number(dbRecord.netProfitMargin) : null,
    ebitdaMargin: dbRecord.ebitdaMargin ? Number(dbRecord.ebitdaMargin) : null,
    returnOnAssets: dbRecord.returnOnAssets ? Number(dbRecord.returnOnAssets) : null,
    returnOnEquity: dbRecord.returnOnEquity ? Number(dbRecord.returnOnEquity) : null,
    returnOnInvestedCapital: dbRecord.returnOnInvestedCapital ? Number(dbRecord.returnOnInvestedCapital) : null,
    // Efficiency ratios
    assetTurnoverRatio: dbRecord.assetTurnoverRatio ? Number(dbRecord.assetTurnoverRatio) : null,
    inventoryTurnoverRatio: dbRecord.inventoryTurnoverRatio ? Number(dbRecord.inventoryTurnoverRatio) : null,
    receivablesTurnoverRatio: dbRecord.receivablesTurnoverRatio ? Number(dbRecord.receivablesTurnoverRatio) : null,
    daysSalesOutstanding: dbRecord.daysSalesOutstanding ? Number(dbRecord.daysSalesOutstanding) : null,
    daysInventoryOutstanding: dbRecord.daysInventoryOutstanding ? Number(dbRecord.daysInventoryOutstanding) : null,
    daysPayablesOutstanding: dbRecord.daysPayablesOutstanding ? Number(dbRecord.daysPayablesOutstanding) : null,
    // Investment ratios
    earningsPerShare: dbRecord.earningsPerShare ? Number(dbRecord.earningsPerShare) : null,
    priceEarningsRatio: dbRecord.priceEarningsRatio ? Number(dbRecord.priceEarningsRatio) : null,
    dividendYield: dbRecord.dividendYield ? Number(dbRecord.dividendYield) : null,
    dividendPayoutRatio: dbRecord.dividendPayoutRatio ? Number(dbRecord.dividendPayoutRatio) : null,
    bookValuePerShare: dbRecord.bookValuePerShare ? Number(dbRecord.bookValuePerShare) : null,
    notes: dbRecord.notes,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: new Date(dbRecord.updatedAt)
  };
}

/**
 * Get all financial ratios that the current user has access to
 */
export async function getFinancialRatios(companyId?: number): Promise<FinancialRatiosListResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial ratios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view financial ratios'
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
          .from(financialRatios)
          .where(eq(financialRatios.companyId, companyId));
      } else if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(financialRatios)
          .where(inArray(financialRatios.companyId, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(financialRatios);
      }
      
      // Convert database types to schema types
      const typedFinancialRatios = result.map(convertToTypedFinancialRatios);
      
      return {
        success: true,
        data: typedFinancialRatios
      };
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      return {
        success: false,
        error: 'Failed to fetch financial ratios'
      };
    }
  });
}

/**
 * Get a single financial ratios entry by ID
 */
export async function getFinancialRatio(id: number): Promise<FinancialRatiosResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view financial ratios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this financial ratios entry'
        };
      }
      
      const financialRatio = await db.query.financialRatios.findFirst({
        where: eq(financialRatios.id, id)
      });
      
      if (!financialRatio) {
        return {
          success: false,
          error: 'Financial ratios entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(financialRatio.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      return {
        success: true,
        data: convertToTypedFinancialRatios(financialRatio)
      };
    } catch (error) {
      console.error('Error fetching financial ratios entry:', error);
      return {
        success: false,
        error: 'Failed to fetch financial ratios entry'
      };
    }
  });
}

/**
 * Create a new financial ratios entry
 */
export async function createFinancialRatios(data: unknown): Promise<FinancialRatiosResponse> {
  const parsed = CreateFinancialRatiosSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create financial ratios
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create financial ratios'
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
      
      // Insert financial ratios into database
      const [newFinancialRatios] = await db.insert(financialRatios)
        .values({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : null
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedFinancialRatios(newFinancialRatios)
      };
    } catch (error) {
      console.error('Error creating financial ratios:', error);
      return {
        success: false,
        error: 'Failed to create financial ratios'
      };
    }
  });
}

/**
 * Update a financial ratios entry
 */
export async function updateFinancialRatios(id: number, data: unknown): Promise<FinancialRatiosResponse> {
  const parsed = UpdateFinancialRatiosSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update financial ratios
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update financial ratios'
        };
      }
      
      // First, get the existing financial ratios to check company access
      const existingFinancialRatios = await db.query.financialRatios.findFirst({
        where: eq(financialRatios.id, id)
      });
      
      if (!existingFinancialRatios) {
        return {
          success: false,
          error: 'Financial ratios entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingFinancialRatios.companyId)) {
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

      const [updatedFinancialRatios] = await db.update(financialRatios)
        .set({
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : undefined
        } as any)
        .where(eq(financialRatios.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedFinancialRatios(updatedFinancialRatios)
      };
    } catch (error) {
      console.error('Error updating financial ratios:', error);
      return {
        success: false,
        error: 'Failed to update financial ratios'
      };
    }
  });
}

/**
 * Delete a financial ratios entry
 */
export async function deleteFinancialRatios(id: number): Promise<FinancialRatiosResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete financial ratios
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES_FINANCIALS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete financial ratios'
        };
      }
      
      // First, get the existing financial ratios to check company access
      const existingFinancialRatios = await db.query.financialRatios.findFirst({
        where: eq(financialRatios.id, id)
      });
      
      if (!existingFinancialRatios) {
        return {
          success: false,
          error: 'Financial ratios entry not found'
        };
      }
      
      // For company users, check if they have access to this company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(existingFinancialRatios.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      await db.delete(financialRatios)
        .where(eq(financialRatios.id, id));

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting financial ratios:', error);
      return {
        success: false,
        error: 'Failed to delete financial ratios'
      };
    }
  });
}