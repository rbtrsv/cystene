'use server';
import { db } from '@database/drizzle';
import { rounds, companies, funds, securities, transactions } from '@database/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel, isStakeholderUser, isGlobalUser } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateRoundSchema, 
  UpdateRoundSchema,
  type RoundResponse,
  type RoundsResponse,
  type RoundType,
  type RoundWithFund,
  type RoundWithSecurities,
  type RoundWithDetails
} from '@/modules/assetmanager/schemas/rounds.schemas';
import { type FundStatus } from '@/modules/assetmanager/schemas/funds.schemas';

/**
 * Get all rounds that the current user has access to
 */
export async function getRounds(): Promise<RoundsResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view rounds
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view rounds'
        };
      }
      
      const result = await db.select().from(rounds);
        
      // Convert database types to schema types
      const typedRounds = result.map(round => ({
        ...round,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
      }));
      
      return {
        success: true,
        data: typedRounds
      };
    } catch (error) {
      console.error('Error fetching rounds:', error);
      return {
        success: false,
        error: 'Failed to fetch rounds'
      };
    }
  });
}


/**
 * Get rounds for a specific fund
 * Stakeholders can view rounds for funds they have transactions in
 */
export async function getRoundsByFund(fundId: number): Promise<RoundsResponse> {
  return withAuth(async (profile) => {
    try {
      // Global users can view all rounds
      if (isGlobalUser(profile, Action.VIEW)) {
        const result = await db.select().from(rounds)
          .where(eq(rounds.fundId, fundId));

        const typedRounds = result.map(round => ({
          ...round,
          roundType: round.roundType as RoundType,
          roundDate: new Date(round.roundDate),
          targetAmount: Number(round.targetAmount),
          raisedAmount: Number(round.raisedAmount),
          preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
          postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
        }));

        return {
          success: true,
          data: typedRounds
        };
      }

      // Stakeholders can view rounds for funds they have transactions in
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder) {
        const stakeholderIds = await getStakeholderIds(profile);

        if (stakeholderIds.length === 0) {
          return {
            success: false,
            error: 'Insufficient permissions to view rounds'
          };
        }

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
            error: 'Insufficient permissions to view rounds'
          };
        }

        const result = await db.select().from(rounds)
          .where(eq(rounds.fundId, fundId));

        const typedRounds = result.map(round => ({
          ...round,
          roundType: round.roundType as RoundType,
          roundDate: new Date(round.roundDate),
          targetAmount: Number(round.targetAmount),
          raisedAmount: Number(round.raisedAmount),
          preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
          postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
        }));

        return {
          success: true,
          data: typedRounds
        };
      }

      return {
        success: false,
        error: 'Insufficient permissions to view rounds'
      };
    } catch (error) {
      console.error('Error fetching rounds by fund:', error);
      return {
        success: false,
        error: 'Failed to fetch rounds'
      };
    }
  });
}

/**
 * Get a single round by ID
 * @param roundId - ID of the round to retrieve
 */
export async function getRound(roundId: number): Promise<RoundResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this round
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this round'
        };
      }
      
      const round = await db.query.rounds.findFirst({
        where: eq(rounds.id, roundId)
      });
      
      if (!round) {
        return {
          success: false,
          error: 'Round not found'
        };
      }
      
      // Convert database types to schema types
      const typedRound = {
        ...round,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
      };
      
      return {
        success: true,
        data: typedRound
      };
    } catch (error) {
      console.error('Error fetching round:', error);
      return {
        success: false,
        error: 'Failed to fetch round'
      };
    }
  });
}


/**
 * Get a round with its associated fund
 * @param roundId - ID of the round to retrieve
 */
export async function getRoundWithFund(roundId: number): Promise<{ success: boolean; data?: RoundWithFund; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this round
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this round'
        };
      }
      
      const round = await db.query.rounds.findFirst({
        where: eq(rounds.id, roundId)
      });
      
      if (!round) {
        return {
          success: false,
          error: 'Round not found'
        };
      }
      
      // Convert database types to schema types
      const typedRound = {
        ...round,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
      };
      
      // Get fund associated with this round
      const fund = await db.query.funds.findFirst({
        where: eq(funds.id, round.fundId)
      });
      
      return {
        success: true,
        data: {
          ...typedRound,
          fund: fund ? {
            id: fund.id,
            name: fund.name,
            status: fund.status as FundStatus
          } : undefined
        }
      };
    } catch (error) {
      console.error('Error fetching round with fund:', error);
      return {
        success: false,
        error: 'Failed to fetch round with fund'
      };
    }
  });
}

/**
 * Get a round with its associated securities
 * @param roundId - ID of the round to retrieve
 */
export async function getRoundWithSecurities(roundId: number): Promise<{ success: boolean; data?: RoundWithSecurities; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this round
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this round'
        };
      }
      
      const round = await db.query.rounds.findFirst({
        where: eq(rounds.id, roundId)
      });
      
      if (!round) {
        return {
          success: false,
          error: 'Round not found'
        };
      }
      
      // Convert database types to schema types
      const typedRound = {
        ...round,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
      };
      
      // Get securities associated with this round
      const roundSecurities = await db.select({
        id: securities.id,
        securityName: securities.securityName,
        securityType: securities.securityType,
        code: securities.code
      }).from(securities)
        .where(eq(securities.roundId, roundId));
      
      return {
        success: true,
        data: {
          ...typedRound,
          securities: roundSecurities
        }
      };
    } catch (error) {
      console.error('Error fetching round with securities:', error);
      return {
        success: false,
        error: 'Failed to fetch round with securities'
      };
    }
  });
}

/**
 * Get a round with all its details (company, fund, securities)
 * @param roundId - ID of the round to retrieve
 */
export async function getRoundWithDetails(roundId: number): Promise<{ success: boolean; data?: RoundWithDetails; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view this round
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this round'
        };
      }
      
      const round = await db.query.rounds.findFirst({
        where: eq(rounds.id, roundId)
      });
      
      if (!round) {
        return {
          success: false,
          error: 'Round not found'
        };
      }
      
      // Convert database types to schema types
      const typedRound = {
        ...round,
        roundType: round.roundType as RoundType,
        roundDate: new Date(round.roundDate),
        targetAmount: Number(round.targetAmount),
        raisedAmount: Number(round.raisedAmount),
        preMoneyValuation: round.preMoneyValuation ? Number(round.preMoneyValuation) : null,
        postMoneyValuation: round.postMoneyValuation ? Number(round.postMoneyValuation) : null
      };
      
      // Get fund associated with this round
      const fund = await db.query.funds.findFirst({
        where: eq(funds.id, round.fundId)
      });
      
      // Get securities associated with this round
      const roundSecurities = await db.select({
        id: securities.id,
        securityName: securities.securityName,
        securityType: securities.securityType,
        code: securities.code
      }).from(securities)
        .where(eq(securities.roundId, roundId));
      
      return {
        success: true,
        data: {
          ...typedRound,
          fund: fund ? {
            id: fund.id,
            name: fund.name,
            status: fund.status as FundStatus
          } : undefined,
          securities: roundSecurities
        }
      };
    } catch (error) {
      console.error('Error fetching round with details:', error);
      return {
        success: false,
        error: 'Failed to fetch round with details'
      };
    }
  });
}

/**
 * Create a new round
 * @param data - Round data from the form
 */
export async function createRound(data: unknown): Promise<RoundResponse> {
  const parsed = CreateRoundSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create rounds
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create rounds'
        };
      }

      // Convert date string to Date object if needed
      const roundDate = typeof parsed.data.roundDate === 'string' 
        ? new Date(parsed.data.roundDate) 
        : parsed.data.roundDate;

      // Insert round into database with validated data
      const [newRound] = await db.insert(rounds)
        .values({
          fundId: parsed.data.fundId,
          roundName: parsed.data.roundName,
          roundType: parsed.data.roundType,
          roundDate: roundDate,
          targetAmount: parsed.data.targetAmount,
          raisedAmount: parsed.data.raisedAmount,
          preMoneyValuation: parsed.data.preMoneyValuation ?? null,
          postMoneyValuation: parsed.data.postMoneyValuation ?? null
        } as any)
        .returning();
      
      // Convert database types to schema types
      const typedRound = {
        ...newRound,
        roundType: newRound.roundType as RoundType,
        roundDate: new Date(newRound.roundDate),
        targetAmount: Number(newRound.targetAmount),
        raisedAmount: Number(newRound.raisedAmount),
        preMoneyValuation: newRound.preMoneyValuation ? Number(newRound.preMoneyValuation) : null,
        postMoneyValuation: newRound.postMoneyValuation ? Number(newRound.postMoneyValuation) : null
      };
      
      return {
        success: true,
        data: typedRound
      };
    } catch (error) {
      console.error('Error creating round:', error);
      return {
        success: false,
        error: 'Failed to create round'
      };
    }
  });
}

/**
 * Update a round's information
 * @param roundId - ID of the round to update
 * @param data - Data to update the round with
 */
export async function updateRound(roundId: number, data: unknown): Promise<RoundResponse> {
  const parsed = UpdateRoundSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update rounds'
        };
      }

      // Convert date string to Date object if needed
      const roundDate = parsed.data.roundDate 
        ? (typeof parsed.data.roundDate === 'string' 
          ? new Date(parsed.data.roundDate) 
          : parsed.data.roundDate)
        : undefined;

      const [updatedRound] = await db.update(rounds)
        .set({
          roundName: parsed.data.roundName,
          ...(parsed.data.roundType && { roundType: parsed.data.roundType }),
          ...(roundDate && { roundDate }),
          ...(parsed.data.targetAmount !== undefined && { targetAmount: parsed.data.targetAmount }),
          ...(parsed.data.raisedAmount !== undefined && { raisedAmount: parsed.data.raisedAmount }),
          ...(parsed.data.preMoneyValuation !== undefined && { preMoneyValuation: parsed.data.preMoneyValuation }),
          ...(parsed.data.postMoneyValuation !== undefined && { postMoneyValuation: parsed.data.postMoneyValuation })
        } as any)
        .where(eq(rounds.id, roundId))
        .returning();

      // Convert database types to schema types
      const typedRound = {
        ...updatedRound,
        roundType: updatedRound.roundType as RoundType,
        roundDate: new Date(updatedRound.roundDate),
        targetAmount: Number(updatedRound.targetAmount),
        raisedAmount: Number(updatedRound.raisedAmount),
        preMoneyValuation: updatedRound.preMoneyValuation ? Number(updatedRound.preMoneyValuation) : null,
        postMoneyValuation: updatedRound.postMoneyValuation ? Number(updatedRound.postMoneyValuation) : null
      };
      
      return {
        success: true,
        data: typedRound
      };
    } catch (error) {
      console.error('Error updating round:', error);
      return {
        success: false,
        error: 'Failed to update round'
      };
    }
  });
}

/**
 * Delete a round
 * @param roundId - ID of the round to delete
 */
export async function deleteRound(roundId: number): Promise<RoundResponse> {
  return withAuth(async (profile) => {
    try {
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.ROUNDS);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete rounds'
        };
      }

      const [deletedRound] = await db.delete(rounds)
        .where(eq(rounds.id, roundId))
        .returning();

      // Convert database types to schema types
      const typedRound = {
        ...deletedRound,
        roundType: deletedRound.roundType as RoundType,
        roundDate: new Date(deletedRound.roundDate),
        targetAmount: Number(deletedRound.targetAmount),
        raisedAmount: Number(deletedRound.raisedAmount),
        preMoneyValuation: deletedRound.preMoneyValuation ? Number(deletedRound.preMoneyValuation) : null,
        postMoneyValuation: deletedRound.postMoneyValuation ? Number(deletedRound.postMoneyValuation) : null
      };
      
      return {
        success: true,
        data: typedRound
      };
    } catch (error) {
      console.error('Error deleting round:', error);
      return {
        success: false,
        error: 'Failed to delete round'
      };
    }
  });
}
