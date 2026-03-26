'use server';
import { db } from '@database/drizzle';
import { investmentPortfolio, companies, funds, rounds, transactions } from '@database/drizzle';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';

import { 
  CreateInvestmentPortfolioSchema, 
  UpdateInvestmentPortfolioSchema,
  type InvestmentPortfolioResponse,
  type InvestmentPortfoliosResponse,
  type InvestmentPortfolioWithRelations,
  type PortfolioStatus,
  type InvestmentType,
  type SectorType
} from '@/modules/assetmanager/schemas/portfolio-investment.schemas';

// ==========================================
// Helper Functions
// ==========================================

/**
 * Calculate MOIC (Multiple on Invested Capital) automatically
 * @param investmentAmount - The investment amount
 * @param currentFairValue - The current fair value
 * @returns The calculated MOIC as a string, or null if cannot be calculated
 */
function calculateMOIC(investmentAmount: number | null, currentFairValue: number | null): string | null {
  if (!investmentAmount || !currentFairValue || investmentAmount === 0) {
    return null;
  }

  const moic = currentFairValue / investmentAmount;
  return moic.toFixed(4); // Store with 4 decimal places for precision
}

/**
 * Convert input data to typed portfolio with proper number conversion for database storage
 * @param data - Raw input data that may contain string or number values
 * @returns Typed data with numeric fields properly converted
 */
function convertToTypedInvestmentPortfolio(data: any) {
  return {
    ...data,
    investmentAmount: data.investmentAmount ? Number(data.investmentAmount) : null,
    ownershipPercentage: data.ownershipPercentage ? Number(data.ownershipPercentage) : null,
    currentFairValue: data.currentFairValue ? Number(data.currentFairValue) : null,
    numberOfShares: data.numberOfShares ? Number(data.numberOfShares) : null,
    sharePrice: data.sharePrice ? Number(data.sharePrice) : null,
    moic: data.moic ? Number(data.moic) : null,
    irr: data.irr ? Number(data.irr) : null
  };
}

/**
 * Get all investment portfolios the user has access to
 */
export async function getInvestmentPortfolios(): Promise<InvestmentPortfoliosResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view investment portfolios'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access
      const result = await db.select()
        .from(investmentPortfolio);
      
      // Convert database types to schema types with proper casting
      const typedResult = result.map(r => convertToTypedInvestmentPortfolio({
        ...r,
        portfolioStatus: r.portfolioStatus as PortfolioStatus,
        investmentType: r.investmentType as InvestmentType,
        sector: r.sector as SectorType
      }));
      
      return {
        success: true,
        data: typedResult
      };
    } catch (error) {
      console.error('Error fetching investment portfolios:', error);
      return {
        success: false,
        error: 'Failed to fetch investment portfolios'
      };
    }
  });
}

/**
 * Get investment portfolios with full relations (company, fund, round details)
 */
export async function getInvestmentPortfoliosWithRelations(): Promise<{
  success: boolean;
  data?: InvestmentPortfolioWithRelations[];
  error?: string;
}> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view investment portfolios'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access
      
      // Build query with relations
      const result = await db.select({
        id: investmentPortfolio.id,
        companyId: investmentPortfolio.companyId,
        fundId: investmentPortfolio.fundId,
        roundId: investmentPortfolio.roundId,
        portfolioStatus: investmentPortfolio.portfolioStatus,
        investmentType: investmentPortfolio.investmentType,
        sector: investmentPortfolio.sector,
        investmentAmount: investmentPortfolio.investmentAmount,
        ownershipPercentage: investmentPortfolio.ownershipPercentage,
        currentFairValue: investmentPortfolio.currentFairValue,
        companyType: investmentPortfolio.companyType,
        numberOfShares: investmentPortfolio.numberOfShares,
        sharePrice: investmentPortfolio.sharePrice,
        moic: investmentPortfolio.moic,
        irr: investmentPortfolio.irr,
        notes: investmentPortfolio.notes,
        createdAt: investmentPortfolio.createdAt,
        updatedAt: investmentPortfolio.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          country: companies.country
        },
        fund: {
          id: funds.id,
          name: funds.name,
          description: funds.description,
          status: funds.status
        },
        round: {
          id: rounds.id,
          name: rounds.roundName
        }
      })
      .from(investmentPortfolio)
      .innerJoin(companies, eq(investmentPortfolio.companyId, companies.id))
      .innerJoin(funds, eq(investmentPortfolio.fundId, funds.id))
      .innerJoin(rounds, eq(investmentPortfolio.roundId, rounds.id));
      
      // Convert database types to schema types with proper casting
      const typedResult = result.map(r => convertToTypedInvestmentPortfolio({
        ...r,
        portfolioStatus: r.portfolioStatus as PortfolioStatus,
        investmentType: r.investmentType as InvestmentType,
        sector: r.sector as SectorType
      }));
      
      return {
        success: true,
        data: typedResult
      };
    } catch (error) {
      console.error('Error fetching investment portfolios with relations:', error);
      return {
        success: false,
        error: 'Failed to fetch investment portfolios with relations'
      };
    }
  });
}

/**
 * Get a single investment portfolio by ID
 * @param investmentPortfolioId - ID of the investment portfolio to retrieve
 */
export async function getInvestmentPortfolio(investmentPortfolioId: number): Promise<InvestmentPortfolioResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this investment portfolio'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access
      
      const investment = await db.query.investmentPortfolio.findFirst({
        where: eq(investmentPortfolio.id, investmentPortfolioId)
      });
      
      if (!investment) {
        return {
          success: false,
          error: 'Investment portfolio not found'
        };
      }
      
      // Convert database type to schema type
      const typedInvestment = convertToTypedInvestmentPortfolio({
        ...investment,
        portfolioStatus: investment.portfolioStatus as PortfolioStatus,
        investmentType: investment.investmentType as InvestmentType,
        sector: investment.sector as SectorType
      });
      
      return {
        success: true,
        data: typedInvestment
      };
    } catch (error) {
      console.error('Error fetching investment portfolio:', error);
      return {
        success: false,
        error: 'Failed to fetch investment portfolio'
      };
    }
  });
}

/**
 * Create a new investment portfolio entry
 * @param data - Investment portfolio data from the form
 */
export async function createInvestmentPortfolio(data: unknown): Promise<InvestmentPortfolioResponse> {
  const parsed = CreateInvestmentPortfolioSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create investment portfolios
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create investment portfolios'
        };
      }
      
      // Calculate MOIC automatically
      const calculatedMOIC = calculateMOIC(parsed.data.investmentAmount ?? null, parsed.data.currentFairValue ?? null);

      // Insert investment portfolio into database with validated data
      const [newInvestment] = await db.insert(investmentPortfolio)
        .values({
          companyId: parsed.data.companyId,
          fundId: parsed.data.fundId,
          roundId: parsed.data.roundId,
          portfolioStatus: parsed.data.portfolioStatus,
          investmentType: parsed.data.investmentType,
          sector: parsed.data.sector,
          investmentAmount: parsed.data.investmentAmount ?? null,
          ownershipPercentage: parsed.data.ownershipPercentage ?? null,
          currentFairValue: parsed.data.currentFairValue ?? null,
          companyType: parsed.data.companyType,
          numberOfShares: parsed.data.numberOfShares ?? null,
          sharePrice: parsed.data.sharePrice ?? null,
          moic: calculatedMOIC,
          irr: parsed.data.irr ?? null,
          notes: parsed.data.notes ?? null
        } as any)
        .returning();
      
      // Convert database type to schema type
      const typedInvestment = convertToTypedInvestmentPortfolio({
        ...newInvestment,
        portfolioStatus: newInvestment.portfolioStatus as PortfolioStatus,
        investmentType: newInvestment.investmentType as InvestmentType,
        sector: newInvestment.sector as SectorType
      });
      
      return {
        success: true,
        data: typedInvestment
      };
    } catch (error) {
      console.error('Error creating investment portfolio:', error);
      return {
        success: false,
        error: 'Failed to create investment portfolio'
      };
    }
  });
}

/**
 * Update an investment portfolio's information
 * @param investmentPortfolioId - ID of the investment portfolio to update
 * @param data - Data to update the investment portfolio with
 */
export async function updateInvestmentPortfolio(investmentPortfolioId: number, data: unknown): Promise<InvestmentPortfolioResponse> {
  const parsed = UpdateInvestmentPortfolioSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update investment portfolios
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update investment portfolios'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access

      // Calculate MOIC automatically (preserve existing values if not being updated)
      let calculatedMOIC: string | null = null;

      // If updating investment amount or current fair value, recalculate MOIC
      if (parsed.data.investmentAmount !== undefined || parsed.data.currentFairValue !== undefined) {
        // Get current values for calculation if not provided
        const currentRecord = await db.select({
          investmentAmount: investmentPortfolio.investmentAmount,
          currentFairValue: investmentPortfolio.currentFairValue
        })
        .from(investmentPortfolio)
        .where(eq(investmentPortfolio.id, investmentPortfolioId))
        .limit(1);

        if (currentRecord.length > 0) {
          const finalInvestmentAmount = parsed.data.investmentAmount ?? (
            currentRecord[0].investmentAmount ? Number(currentRecord[0].investmentAmount) : null
          );
          const finalCurrentFairValue = parsed.data.currentFairValue ?? (
            currentRecord[0].currentFairValue ? Number(currentRecord[0].currentFairValue) : null
          );

          calculatedMOIC = calculateMOIC(finalInvestmentAmount, finalCurrentFairValue);
        }
      }

      const [updatedInvestment] = await db.update(investmentPortfolio)
        .set({
          companyId: parsed.data.companyId,
          fundId: parsed.data.fundId,
          roundId: parsed.data.roundId,
          portfolioStatus: parsed.data.portfolioStatus,
          investmentType: parsed.data.investmentType,
          sector: parsed.data.sector,
          investmentAmount: parsed.data.investmentAmount ?? null,
          ownershipPercentage: parsed.data.ownershipPercentage ?? null,
          currentFairValue: parsed.data.currentFairValue ?? null,
          companyType: parsed.data.companyType,
          numberOfShares: parsed.data.numberOfShares ?? null,
          sharePrice: parsed.data.sharePrice ?? null,
          ...(calculatedMOIC !== null && { moic: calculatedMOIC }),
          irr: parsed.data.irr ?? null,
          notes: parsed.data.notes ?? null
        } as any)
        .where(eq(investmentPortfolio.id, investmentPortfolioId))
        .returning();

      // Convert database type to schema type
      const typedInvestment = convertToTypedInvestmentPortfolio({
        ...updatedInvestment,
        portfolioStatus: updatedInvestment.portfolioStatus as PortfolioStatus,
        investmentType: updatedInvestment.investmentType as InvestmentType,
        sector: updatedInvestment.sector as SectorType
      });

      return {
        success: true,
        data: typedInvestment
      };
    } catch (error) {
      console.error('Error updating investment portfolio:', error);
      return {
        success: false,
        error: 'Failed to update investment portfolio'
      };
    }
  });
}

/**
 * Delete an investment portfolio entry
 * @param investmentPortfolioId - ID of the investment portfolio to delete
 */
export async function deleteInvestmentPortfolio(investmentPortfolioId: number): Promise<InvestmentPortfolioResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete investment portfolios
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete investment portfolios'
        };
      }
      
      const [deletedInvestment] = await db.delete(investmentPortfolio)
        .where(eq(investmentPortfolio.id, investmentPortfolioId))
        .returning();

      // Convert database type to schema type
      const typedInvestment = convertToTypedInvestmentPortfolio({
        ...deletedInvestment,
        portfolioStatus: deletedInvestment.portfolioStatus as PortfolioStatus,
        investmentType: deletedInvestment.investmentType as InvestmentType,
        sector: deletedInvestment.sector as SectorType
      });

      return {
        success: true,
        data: typedInvestment
      };
    } catch (error) {
      console.error('Error deleting investment portfolio:', error);
      return {
        success: false,
        error: 'Failed to delete investment portfolio'
      };
    }
  });
}

/**
 * Get investment portfolios by company ID
 * @param companyId - ID of the company
 */
export async function getInvestmentPortfoliosByCompany(companyId: number): Promise<InvestmentPortfoliosResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view investment portfolios'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access
      
      // Get investment portfolios for the specific company
      const result = await db.select()
        .from(investmentPortfolio)
        .where(eq(investmentPortfolio.companyId, companyId));
      
      // Convert database types to schema types with proper casting
      const typedResult = result.map(r => convertToTypedInvestmentPortfolio({
        ...r,
        portfolioStatus: r.portfolioStatus as PortfolioStatus,
        investmentType: r.investmentType as InvestmentType,
        sector: r.sector as SectorType
      }));
      
      return {
        success: true,
        data: typedResult
      };
    } catch (error) {
      console.error('Error fetching investment portfolios by company:', error);
      return {
        success: false,
        error: 'Failed to fetch investment portfolios for company'
      };
    }
  });
}

/**
 * Get investment portfolios by fund ID
 * @param fundId - ID of the fund
 */
export async function getInvestmentPortfoliosByFund(fundId: number): Promise<InvestmentPortfoliosResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view investment portfolios'
        };
      }
      
      // For investment portfolios, all authorized users see everything
      // No filtering needed - ADMIN/EDITOR/VIEWER and stakeholder users all have full access
      
      // Get investment portfolios for the specific fund
      const result = await db.select()
        .from(investmentPortfolio)
        .where(eq(investmentPortfolio.fundId, fundId));
      
      // Convert database types to schema types with proper casting
      const typedResult = result.map(r => convertToTypedInvestmentPortfolio({
        ...r,
        portfolioStatus: r.portfolioStatus as PortfolioStatus,
        investmentType: r.investmentType as InvestmentType,
        sector: r.sector as SectorType
      }));
      
      return {
        success: true,
        data: typedResult
      };
    } catch (error) {
      console.error('Error fetching investment portfolios by fund:', error);
      return {
        success: false,
        error: 'Failed to fetch investment portfolios for fund'
      };
    }
  });
}

/**
 * Get total fund units from transactions
 * Entity Perspective: Returns the sum of (unitsCredit - unitsDebit) for all transactions in a fund
 * - unitsCredit = Fund issues units TO stakeholder (stakeholder receives)
 * - unitsDebit = Fund redeems units FROM stakeholder (stakeholder loses)
 * @param fundId - Optional fund ID to filter by specific fund
 */
export async function getFundUnits(fundId?: number): Promise<{ success: boolean; data?: number; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view investment portfolios
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.INVESTMENT_PORTFOLIO);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view fund units'
        };
      }

      // Build query to calculate total fund units
      const whereConditions = fundId ? [eq(transactions.fundId, fundId)] : [];

      const result = await db
        .select({
          totalUnits: sql<number>`COALESCE(SUM(${transactions.unitsCredit} - ${transactions.unitsDebit}), 0)`
        })
        .from(transactions)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const totalUnits = result[0]?.totalUnits || 0;

      return {
        success: true,
        data: Number(totalUnits)
      };
    } catch (error) {
      console.error('Error fetching fund units:', error);
      return {
        success: false,
        error: 'Failed to fetch fund units'
      };
    }
  });
}
