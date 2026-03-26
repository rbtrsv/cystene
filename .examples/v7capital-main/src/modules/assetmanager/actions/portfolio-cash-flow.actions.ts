'use server';

import { db } from '@database/drizzle';
import { portfolioCashFlow } from '@database/drizzle/models/portfolio';
import { companies } from '@database/drizzle/models/companies';
import { funds, rounds } from '@database/drizzle/models/captable';
import { eq, desc } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { revalidatePath } from 'next/cache';
import {
  CreatePortfolioCashFlowSchema,
  UpdatePortfolioCashFlowSchema,
  type PortfolioCashFlowResponse,
  type PortfolioCashFlowsResponse,
  type PortfolioCashFlowDeleteResponse,
  type PortfolioCashFlowsWithRelationsResponse,
  type CashFlowScenario,
  type CashFlowType
} from '../schemas/portfolio-cash-flow.schemas';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Convert database result to properly typed cash flow
 */
function convertToTypedCashFlow(dbResult: any) {
  return {
    ...dbResult,
    date: new Date(dbResult.date),
    amountDebit: dbResult.amountDebit ? Number(dbResult.amountDebit) : 0,
    amountCredit: dbResult.amountCredit ? Number(dbResult.amountCredit) : 0,
    cashFlowType: dbResult.cashFlowType as CashFlowType,
    scenario: dbResult.scenario as CashFlowScenario,
    createdAt: new Date(dbResult.createdAt),
    updatedAt: new Date(dbResult.updatedAt)
  };
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all portfolio cash flows with relations
 */
export async function getPortfolioCashFlowsWithRelations(): Promise<PortfolioCashFlowsWithRelationsResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flows'
        };
      }

      const cashFlows = await db
        .select({
          id: portfolioCashFlow.id,
          companyId: portfolioCashFlow.companyId,
          fundId: portfolioCashFlow.fundId,
          roundId: portfolioCashFlow.roundId,
          date: portfolioCashFlow.date,
          amountDebit: portfolioCashFlow.amountDebit,
          amountCredit: portfolioCashFlow.amountCredit,
          currency: portfolioCashFlow.currency,
          cashFlowType: portfolioCashFlow.cashFlowType,
          scenario: portfolioCashFlow.scenario,
          transactionReference: portfolioCashFlow.transactionReference,
          description: portfolioCashFlow.description,
          includeInIrr: portfolioCashFlow.includeInIrr,
          createdAt: portfolioCashFlow.createdAt,
          updatedAt: portfolioCashFlow.updatedAt,
          company: {
            id: companies.id,
            name: companies.name,
          },
          fund: {
            id: funds.id,
            name: funds.name,
          },
          round: {
            id: rounds.id,
            name: rounds.roundName,
          },
        })
        .from(portfolioCashFlow)
        .leftJoin(companies, eq(portfolioCashFlow.companyId, companies.id))
        .leftJoin(funds, eq(portfolioCashFlow.fundId, funds.id))
        .leftJoin(rounds, eq(portfolioCashFlow.roundId, rounds.id))
        .orderBy(desc(portfolioCashFlow.date), desc(portfolioCashFlow.createdAt));

      // Convert database types to schema types with proper casting
      const typedResult = cashFlows.map(r => convertToTypedCashFlow(r));

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flows:', error);
      return {
        success: false,
        error: `Failed to fetch cash flows: ${error.message}`
      };
    }
  });
}

/**
 * Get all portfolio cash flows
 */
export async function getPortfolioCashFlows(): Promise<PortfolioCashFlowsResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flows'
        };
      }

      const cashFlows = await db
        .select()
        .from(portfolioCashFlow)
        .orderBy(desc(portfolioCashFlow.date), desc(portfolioCashFlow.createdAt));

      // Convert database types to schema types with proper casting
      const typedResult = cashFlows.map(r => convertToTypedCashFlow(r));

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flows:', error);
      return {
        success: false,
        error: `Failed to fetch cash flows: ${error.message}`
      };
    }
  });
}

/**
 * Get a single portfolio cash flow by ID
 */
export async function getPortfolioCashFlow(id: number): Promise<PortfolioCashFlowResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flow'
        };
      }

      const cashFlow = await db
        .select()
        .from(portfolioCashFlow)
        .where(eq(portfolioCashFlow.id, id))
        .limit(1);

      if (cashFlow.length === 0) {
        return {
          success: false,
          error: 'Cash flow not found'
        };
      }

      const typedResult = convertToTypedCashFlow(cashFlow[0]);

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flow:', error);
      return {
        success: false,
        error: `Failed to fetch cash flow: ${error.message}`
      };
    }
  });
}

/**
 * Get portfolio cash flows by company
 */
export async function getPortfolioCashFlowsByCompany(companyId: number): Promise<PortfolioCashFlowsResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flows'
        };
      }

      const cashFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(eq(portfolioCashFlow.companyId, companyId))
        .orderBy(desc(portfolioCashFlow.date), desc(portfolioCashFlow.createdAt));

      const typedResult = cashFlows.map(r => convertToTypedCashFlow(r));

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flows by company:', error);
      return {
        success: false,
        error: `Failed to fetch cash flows: ${error.message}`
      };
    }
  });
}

/**
 * Get portfolio cash flows by fund
 */
export async function getPortfolioCashFlowsByFund(fundId: number): Promise<PortfolioCashFlowsResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flows'
        };
      }

      const cashFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(eq(portfolioCashFlow.fundId, fundId))
        .orderBy(desc(portfolioCashFlow.date), desc(portfolioCashFlow.createdAt));

      const typedResult = cashFlows.map(r => convertToTypedCashFlow(r));

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flows by fund:', error);
      return {
        success: false,
        error: `Failed to fetch cash flows: ${error.message}`
      };
    }
  });
}

/**
 * Get portfolio cash flows by round
 */
export async function getPortfolioCashFlowsByRound(roundId: number): Promise<PortfolioCashFlowsResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view cash flows'
        };
      }

      const cashFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(eq(portfolioCashFlow.roundId, roundId))
        .orderBy(desc(portfolioCashFlow.date), desc(portfolioCashFlow.createdAt));

      const typedResult = cashFlows.map(r => convertToTypedCashFlow(r));

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error fetching cash flows by round:', error);
      return {
        success: false,
        error: `Failed to fetch cash flows: ${error.message}`
      };
    }
  });
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create a new portfolio cash flow
 */
export async function createPortfolioCashFlow(data: unknown): Promise<PortfolioCashFlowResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create cash flow'
        };
      }

      // Validate input data
      const parsed = CreatePortfolioCashFlowSchema.safeParse(data);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors[0]?.message || 'Invalid input data'
        };
      }

      const validatedData = parsed.data;

      const [newCashFlow] = await db
        .insert(portfolioCashFlow)
        .values({
          companyId: validatedData.companyId,
          fundId: validatedData.fundId,
          roundId: validatedData.roundId,
          date: validatedData.date,
          amountDebit: validatedData.amountDebit || 0,
          amountCredit: validatedData.amountCredit || 0,
          currency: validatedData.currency,
          cashFlowType: validatedData.cashFlowType,
          scenario: validatedData.scenario,
          transactionReference: validatedData.transactionReference,
          description: validatedData.description,
          includeInIrr: validatedData.includeInIrr,
        } as any)
        .returning();

      revalidatePath('/dashboard/portfolio');

      const typedResult = convertToTypedCashFlow(newCashFlow);

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error creating cash flow:', error);
      return {
        success: false,
        error: `Failed to create cash flow: ${error.message}`
      };
    }
  });
}

/**
 * Update an existing portfolio cash flow
 */
export async function updatePortfolioCashFlow(id: number, data: unknown): Promise<PortfolioCashFlowResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update cash flow'
        };
      }

      // Validate input data
      const parsed = UpdatePortfolioCashFlowSchema.safeParse(data);
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error.errors[0]?.message || 'Invalid input data'
        };
      }

      const validatedData = parsed.data;

      const dbData = {
        ...validatedData,
        ...(validatedData.amountDebit !== undefined && { amountDebit: validatedData.amountDebit }),
        ...(validatedData.amountCredit !== undefined && { amountCredit: validatedData.amountCredit })
      };

      const [updatedCashFlow] = await db
        .update(portfolioCashFlow)
        .set(dbData as any)
        .where(eq(portfolioCashFlow.id, id))
        .returning();

      if (!updatedCashFlow) {
        return {
          success: false,
          error: 'Cash flow not found'
        };
      }

      revalidatePath('/dashboard/portfolio');

      const typedResult = convertToTypedCashFlow(updatedCashFlow);

      return { success: true, data: typedResult };
    } catch (error: any) {
      console.error('Error updating cash flow:', error);
      return {
        success: false,
        error: `Failed to update cash flow: ${error.message}`
      };
    }
  });
}

/**
 * Delete a portfolio cash flow
 */
export async function deletePortfolioCashFlow(id: number): Promise<PortfolioCashFlowDeleteResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.PORTFOLIO_CASH_FLOW);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete cash flow'
        };
      }

      const result = await db
        .delete(portfolioCashFlow)
        .where(eq(portfolioCashFlow.id, id))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          error: 'Cash flow not found'
        };
      }

      revalidatePath('/dashboard/portfolio');

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting cash flow:', error);
      return {
        success: false,
        error: `Failed to delete cash flow: ${error.message}`
      };
    }
  });
}