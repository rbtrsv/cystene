'use server';
import { db } from '@database/drizzle';
import { funds, stakeholders, rounds, transactions } from '@database/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel, isStakeholderUser, isGlobalUser } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateFundSchema, 
  UpdateFundSchema,
  type FundResponse,
  type FundsResponse,
  type FundStatus,
  type FundWithStakeholders,
  type FundWithRounds
} from '@/modules/assetmanager/schemas/funds.schemas';
import { type RoundType } from '@/modules/assetmanager/schemas/rounds.schemas';

/**
 * Get all funds that the current user has access to
 * Stakeholders see only funds they have transactions in
 */
export async function getFunds(): Promise<FundsResponse> {
  return withAuth(async (profile) => {
    try {
      // Global users can view all funds
      if (isGlobalUser(profile, Action.VIEW)) {
        const result = await db.select().from(funds);

        const typedFunds = result.map(fund => ({
          ...fund,
          status: fund.status as FundStatus,
          targetSize: fund.targetSize ? Number(fund.targetSize) : null
        }));

        return {
          success: true,
          data: typedFunds
        };
      }

      // Stakeholders see only funds they have transactions in
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder) {
        const stakeholderIds = await getStakeholderIds(profile);

        if (stakeholderIds.length === 0) {
          return {
            success: true,
            data: []
          };
        }

        const stakeholderTransactions = await db
          .selectDistinct({ fundId: transactions.fundId })
          .from(transactions)
          .where(inArray(transactions.stakeholderId, stakeholderIds));

        const fundIds = stakeholderTransactions.map(t => t.fundId);

        if (fundIds.length === 0) {
          return {
            success: true,
            data: []
          };
        }

        const result = await db
          .select()
          .from(funds)
          .where(inArray(funds.id, fundIds));

        const typedFunds = result.map(fund => ({
          ...fund,
          status: fund.status as FundStatus,
          targetSize: fund.targetSize ? Number(fund.targetSize) : null
        }));

        return {
          success: true,
          data: typedFunds
        };
      }

      return {
        success: false,
        error: 'Insufficient permissions to view funds'
      };
    } catch (error) {
      console.error('Error fetching funds:', error);
      return {
        success: false,
        error: 'Failed to fetch funds'
      };
    }
  });
}

/**
 * Get a single fund by ID
 */
export async function getFund(fundId: number): Promise<FundResponse> {
  return withAuth(async (profile) => {
    try {
      // Global users can view any fund
      if (isGlobalUser(profile, Action.VIEW)) {
        const fund = await db.query.funds.findFirst({
          where: eq(funds.id, fundId)
        });

        if (!fund) {
          return {
            success: false,
            error: 'Fund not found'
          };
        }

        const typedFund = {
          ...fund,
          status: fund.status as FundStatus,
          targetSize: fund.targetSize ? Number(fund.targetSize) : null
        };

        return {
          success: true,
          data: typedFund
        };
      }

      // Stakeholders can view a fund if they have transactions in it
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder) {
        const stakeholderIds = await getStakeholderIds(profile);

        if (stakeholderIds.length === 0) {
          return {
            success: false,
            error: 'Insufficient permissions to view this fund'
          };
        }

        // Check if stakeholder has transactions in this fund
        const hasTransactions = await db
          .select({ fundId: transactions.fundId })
          .from(transactions)
          .where(
            and(
              eq(transactions.fundId, fundId),
              inArray(transactions.stakeholderId, stakeholderIds)
            )
          )
          .limit(1);

        if (hasTransactions.length === 0) {
          return {
            success: false,
            error: 'Insufficient permissions to view this fund'
          };
        }

        const fund = await db.query.funds.findFirst({
          where: eq(funds.id, fundId)
        });

        if (!fund) {
          return {
            success: false,
            error: 'Fund not found'
          };
        }

        const typedFund = {
          ...fund,
          status: fund.status as FundStatus,
          targetSize: fund.targetSize ? Number(fund.targetSize) : null
        };

        return {
          success: true,
          data: typedFund
        };
      }

      return {
        success: false,
        error: 'Insufficient permissions to view this fund'
      };
    } catch (error) {
      console.error('Error fetching fund:', error);
      return {
        success: false,
        error: 'Failed to fetch fund'
      };
    }
  });
}

/**
 * Get a fund with its associated stakeholders
 * @param fundId - ID of the fund to retrieve
 */
export async function getFundWithStakeholders(fundId: number): Promise<{ success: boolean; data?: FundWithStakeholders; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this fund
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.FUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this fund'
        };
      }
      
      const fund = await db.query.funds.findFirst({
        where: eq(funds.id, fundId)
      });
      
      if (!fund) {
        return {
          success: false,
          error: 'Fund not found'
        };
      }
      
      // Convert database types to schema types
      const typedFund = {
        ...fund,
        status: fund.status as FundStatus,
        targetSize: fund.targetSize ? Number(fund.targetSize) : null
      };
      
      // Get stakeholders associated with this fund
      // Note: This is a placeholder. In a real application, you would need to
      // define the relationship between funds and stakeholders in your database schema
      // and use the appropriate join condition.
      const fundStakeholders = await db.select({
        id: stakeholders.id,
        stakeholderName: stakeholders.stakeholderName,
        type: stakeholders.type
      }).from(stakeholders);
      // .innerJoin(someTable, eq(someTable.stakeholderId, stakeholders.id))
      // .where(eq(someTable.fundId, fundId));
      
      return {
        success: true,
        data: {
          ...typedFund,
          stakeholders: fundStakeholders
        }
      };
    } catch (error) {
      console.error('Error fetching fund with stakeholders:', error);
      return {
        success: false,
        error: 'Failed to fetch fund with stakeholders'
      };
    }
  });
}

/**
 * Get a fund with its associated rounds
 * @param fundId - ID of the fund to retrieve
 */
export async function getFundWithRounds(fundId: number): Promise<{ success: boolean; data?: FundWithRounds; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this fund
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.FUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this fund'
        };
      }
      
      const fund = await db.query.funds.findFirst({
        where: eq(funds.id, fundId)
      });
      
      if (!fund) {
        return {
          success: false,
          error: 'Fund not found'
        };
      }
      
      // Convert database types to schema types
      const typedFund = {
        ...fund,
        status: fund.status as FundStatus,
        targetSize: fund.targetSize ? Number(fund.targetSize) : null
      };
      
      // Get rounds associated with this fund
      const dbRounds = await db.select().from(rounds)
        .where(eq(rounds.fundId, fundId));
      
      // Convert database types to schema types
      const typedRounds = dbRounds.map(round => ({
        id: round.id,
        fundId: round.fundId,
        roundName: round.roundName,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null,
        createdAt: round.createdAt,
        updatedAt: round.updatedAt
      }));
      
      return {
        success: true,
        data: {
          ...typedFund,
          rounds: typedRounds
        }
      };
    } catch (error) {
      console.error('Error fetching fund with rounds:', error);
      return {
        success: false,
        error: 'Failed to fetch fund with rounds'
      };
    }
  });
}

/**
 * Create a new fund
 * @param data - Fund data from the form
 */
export async function createFund(data: unknown): Promise<FundResponse> {
  const parsed = CreateFundSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create funds
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.FUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create funds'
        };
      }

      // Insert fund into database with validated data
      const [newFund] = await db.insert(funds)
        .values({
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          targetSize: parsed.data.targetSize ?? null,
          vintage: parsed.data.vintage ?? null,
          status: parsed.data.status ?? 'Active'
        } as any)
        .returning();
      
      // Convert database types to schema types
      const typedFund = {
        ...newFund,
        status: newFund.status as FundStatus,
        targetSize: newFund.targetSize ? Number(newFund.targetSize) : null
      };
      
      return {
        success: true,
        data: typedFund
      };
    } catch (error) {
      console.error('Error creating fund:', error);
      return {
        success: false,
        error: 'Failed to create fund'
      };
    }
  });
}

/**
 * Update a fund's information
 * @param fundId - ID of the fund to update
 * @param data - Data to update the fund with
 */
export async function updateFund(fundId: number, data: unknown): Promise<FundResponse> {
  const parsed = UpdateFundSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.FUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update funds'
        };
      }

      const [updatedFund] = await db.update(funds)
        .set({
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          targetSize: parsed.data.targetSize ?? null,
          vintage: parsed.data.vintage ?? null,
          ...(parsed.data.status && { status: parsed.data.status })
        } as any)
        .where(eq(funds.id, fundId))
        .returning();

      // Convert database types to schema types
      const typedFund = {
        ...updatedFund,
        status: updatedFund.status as FundStatus,
        targetSize: updatedFund.targetSize ? Number(updatedFund.targetSize) : null
      };
      
      return {
        success: true,
        data: typedFund
      };
    } catch (error) {
      console.error('Error updating fund:', error);
      return {
        success: false,
        error: 'Failed to update fund'
      };
    }
  });
}

/**
 * Delete a fund
 * @param fundId - ID of the fund to delete
 */
export async function deleteFund(fundId: number): Promise<FundResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.FUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete funds'
        };
      }

      const [deletedFund] = await db.delete(funds)
        .where(eq(funds.id, fundId))
        .returning();

      // Convert database types to schema types
      const typedFund = {
        ...deletedFund,
        status: deletedFund.status as FundStatus,
        targetSize: deletedFund.targetSize ? Number(deletedFund.targetSize) : null
      };
      
      return {
        success: true,
        data: typedFund
      };
    } catch (error) {
      console.error('Error deleting fund:', error);
      return {
        success: false,
        error: 'Failed to delete fund'
      };
    }
  });
}
