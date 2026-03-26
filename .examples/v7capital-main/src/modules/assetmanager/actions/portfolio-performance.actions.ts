'use server';

import { db } from '@database/drizzle';
import { portfolioPerformance } from '@database/drizzle/models/portfolio';
import { eq, inArray, and } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreatePortfolioPerformanceSchema, 
  UpdatePortfolioPerformanceSchema,
  type PortfolioPerformanceResponse,
  type PortfolioPerformancesResponse,
  type PortfolioPerformance
} from '@/modules/assetmanager/schemas/portfolio-performance.schemas';

/**
 * Convert database record to typed portfolio performance
 */
function convertToTypedPortfolioPerformance(dbRecord: any): PortfolioPerformance {
  return {
    id: dbRecord.id,
    fundId: dbRecord.fundId,
    roundId: dbRecord.roundId,
    reportDate: dbRecord.reportDate || '',
    totalInvestedAmount: dbRecord.totalInvestedAmount ? Number(dbRecord.totalInvestedAmount) : null,
    fairValue: dbRecord.fairValue ? Number(dbRecord.fairValue) : null,
    cashRealized: dbRecord.cashRealized ? Number(dbRecord.cashRealized) : null,
    nav: dbRecord.nav ? Number(dbRecord.nav) : null,
    totalFundUnits: dbRecord.totalFundUnits ? Number(dbRecord.totalFundUnits) : null,
    navPerShare: dbRecord.navPerShare ? Number(dbRecord.navPerShare) : null,
    tvpi: dbRecord.tvpi ? Number(dbRecord.tvpi) : null,
    dpi: dbRecord.dpi ? Number(dbRecord.dpi) : null,
    rvpi: dbRecord.rvpi ? Number(dbRecord.rvpi) : null,
    irr: dbRecord.irr ? Number(dbRecord.irr) : null,
    notes: dbRecord.notes || null,
    createdAt: new Date(dbRecord.createdAt),
    updatedAt: dbRecord.updatedAt ? new Date(dbRecord.updatedAt) : null
  };
}

/**
 * Get all portfolio performance entries that the current user has access to
 */
export async function getPortfolioPerformances(fundId?: number, roundId?: number): Promise<PortfolioPerformancesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view portfolio performance
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_PERFORMANCE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view portfolio performance'
        };
      }
      
      // Get stakeholder IDs for filtering (if applicable)
      const stakeholderIds = await getStakeholderIds(profile);
      
      // Build query based on user type and optional filters
      const conditions = [];
      
      // Apply filters if provided
      if (fundId) {
        conditions.push(eq(portfolioPerformance.fundId, fundId));
      }
      if (roundId) {
        conditions.push(eq(portfolioPerformance.roundId, roundId));
      }
      
      // For stakeholder users, additional filtering would be needed
      // This depends on how stakeholder access is determined for funds/rounds
      const result = conditions.length > 0 
        ? await db.select().from(portfolioPerformance).where(and(...conditions))
        : await db.select().from(portfolioPerformance);
      
      // Convert database types to schema types
      const typedPortfolioPerformances = result.map(convertToTypedPortfolioPerformance);
      
      return {
        success: true,
        data: typedPortfolioPerformances
      };
    } catch (error) {
      console.error('Error fetching portfolio performances:', error);
      return {
        success: false,
        error: 'Failed to fetch portfolio performances'
      };
    }
  });
}

/**
 * Get a single portfolio performance entry by ID
 */
export async function getPortfolioPerformance(id: number): Promise<PortfolioPerformanceResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view portfolio performance
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PORTFOLIO_PERFORMANCE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this portfolio performance entry'
        };
      }
      
      const portfolioPerformanceEntry = await db.query.portfolioPerformance.findFirst({
        where: eq(portfolioPerformance.id, id)
      });
      
      if (!portfolioPerformanceEntry) {
        return {
          success: false,
          error: 'Portfolio performance entry not found'
        };
      }
      
      // For stakeholder users, additional access checks would be needed
      // This depends on how stakeholder access is determined for funds/rounds
      
      return {
        success: true,
        data: convertToTypedPortfolioPerformance(portfolioPerformanceEntry)
      };
    } catch (error) {
      console.error('Error fetching portfolio performance entry:', error);
      return {
        success: false,
        error: 'Failed to fetch portfolio performance entry'
      };
    }
  });
}

/**
 * Create a new portfolio performance entry
 */
export async function createPortfolioPerformance(data: unknown): Promise<PortfolioPerformanceResponse> {
  const parsed = CreatePortfolioPerformanceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create portfolio performance
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.PORTFOLIO_PERFORMANCE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create portfolio performance'
        };
      }
      
      // For stakeholder users, check if they have access to this specific fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access
      
      // Insert portfolio performance into database
      const [newPortfolioPerformance] = await db.insert(portfolioPerformance)
        .values({
          ...parsed.data,
          reportDate: new Date(parsed.data.reportDate)
        } as any)
        .returning();
      
      return {
        success: true,
        data: convertToTypedPortfolioPerformance(newPortfolioPerformance)
      };
    } catch (error) {
      console.error('Error creating portfolio performance:', error);
      return {
        success: false,
        error: 'Failed to create portfolio performance'
      };
    }
  });
}

/**
 * Update a portfolio performance entry
 */
export async function updatePortfolioPerformance(id: number, data: unknown): Promise<PortfolioPerformanceResponse> {
  const parsed = UpdatePortfolioPerformanceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update portfolio performance
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.PORTFOLIO_PERFORMANCE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update portfolio performance'
        };
      }
      
      // First, get the existing portfolio performance to check access
      const existingPortfolioPerformance = await db.query.portfolioPerformance.findFirst({
        where: eq(portfolioPerformance.id, id)
      });
      
      if (!existingPortfolioPerformance) {
        return {
          success: false,
          error: 'Portfolio performance entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access
      
      const updateData = {
        ...parsed.data,
        reportDate: parsed.data.reportDate ? new Date(parsed.data.reportDate) : undefined
      };

      const [updatedPortfolioPerformance] = await db.update(portfolioPerformance)
        .set(updateData as any)
        .where(eq(portfolioPerformance.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedPortfolioPerformance(updatedPortfolioPerformance)
      };
    } catch (error) {
      console.error('Error updating portfolio performance:', error);
      return {
        success: false,
        error: 'Failed to update portfolio performance'
      };
    }
  });
}

/**
 * Delete a portfolio performance entry
 */
export async function deletePortfolioPerformance(id: number): Promise<PortfolioPerformanceResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete portfolio performance
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.PORTFOLIO_PERFORMANCE);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete portfolio performance'
        };
      }
      
      // First, get the existing portfolio performance to check access
      const existingPortfolioPerformance = await db.query.portfolioPerformance.findFirst({
        where: eq(portfolioPerformance.id, id)
      });
      
      if (!existingPortfolioPerformance) {
        return {
          success: false,
          error: 'Portfolio performance entry not found'
        };
      }
      
      // For stakeholder users, check if they have access to this fund/round
      const stakeholderIds = await getStakeholderIds(profile);
      // Additional access checks would be needed here based on fund/round access

      const [deletedPortfolioPerformance] = await db.delete(portfolioPerformance)
        .where(eq(portfolioPerformance.id, id))
        .returning();

      return {
        success: true,
        data: convertToTypedPortfolioPerformance(deletedPortfolioPerformance)
      };
    } catch (error) {
      console.error('Error deleting portfolio performance:', error);
      return {
        success: false,
        error: 'Failed to delete portfolio performance'
      };
    }
  });
}