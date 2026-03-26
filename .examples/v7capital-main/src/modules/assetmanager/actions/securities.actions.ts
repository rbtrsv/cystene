'use server';

import { db } from '@database/drizzle';
import { securities, rounds, stakeholders, transactions } from '@database/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { 
  SecuritySchema,
  CreateSecuritySchema, 
  UpdateSecuritySchema,
  type SecurityResponse,
  type SecuritiesResponse,
  type SecurityType,
  type Security,
} from '@/modules/assetmanager/schemas/securities.schemas';

/**
 * Helper function to convert database security to typed Security
 */
function convertToTypedSecurity(dbSecurity: any): Security {
  return {
    id: dbSecurity.id,
    securityName: dbSecurity.securityName,
    code: dbSecurity.code,
    roundId: dbSecurity.roundId,
    securityType: dbSecurity.securityType,
    currency: dbSecurity.currency,
    specialTerms: dbSecurity.specialTerms,
    createdAt: new Date(dbSecurity.createdAt),
    updatedAt: new Date(dbSecurity.updatedAt),
    
    // Convert numeric fields from string to number if needed
    issuePrice: dbSecurity.issuePrice ? Number(dbSecurity.issuePrice) : undefined,
    liquidationPreference: dbSecurity.liquidationPreference ? Number(dbSecurity.liquidationPreference) : undefined,
    participationCap: dbSecurity.participationCap ? Number(dbSecurity.participationCap) : undefined,
    seniority: dbSecurity.seniority ? Number(dbSecurity.seniority) : undefined,
    dividendRate: dbSecurity.dividendRate ? Number(dbSecurity.dividendRate) : undefined,
    conversionRatio: dbSecurity.conversionRatio ? Number(dbSecurity.conversionRatio) : undefined,
    redemptionTerm: dbSecurity.redemptionTerm ? Number(dbSecurity.redemptionTerm) : undefined,
    lockupMonths: dbSecurity.lockupMonths ? Number(dbSecurity.lockupMonths) : null,
    votingRatio: dbSecurity.votingRatio ? Number(dbSecurity.votingRatio) : undefined,
    interestRate: dbSecurity.interestRate ? Number(dbSecurity.interestRate) : undefined,
    valuationCap: dbSecurity.valuationCap ? Number(dbSecurity.valuationCap) : undefined,
    conversionDiscount: dbSecurity.conversionDiscount ? Number(dbSecurity.conversionDiscount) : undefined,
    strikePrice: dbSecurity.strikePrice ? Number(dbSecurity.strikePrice) : undefined,
    exerciseWindowDays: dbSecurity.exerciseWindowDays ? Number(dbSecurity.exerciseWindowDays) : undefined,
    totalShares: dbSecurity.totalShares ? Number(dbSecurity.totalShares) : undefined,
    vestingMonths: dbSecurity.vestingMonths ? Number(dbSecurity.vestingMonths) : undefined,
    cliffMonths: dbSecurity.cliffMonths ? Number(dbSecurity.cliffMonths) : undefined,
    poolSize: dbSecurity.poolSize ? Number(dbSecurity.poolSize) : undefined,
    poolAvailable: dbSecurity.poolAvailable ? Number(dbSecurity.poolAvailable) : undefined,
    principal: dbSecurity.principal ? Number(dbSecurity.principal) : undefined,
    couponRate: dbSecurity.couponRate ? Number(dbSecurity.couponRate) : undefined,
    tenureMonths: dbSecurity.tenureMonths ? Number(dbSecurity.tenureMonths) : undefined,
    moratoriumPeriod: dbSecurity.moratoriumPeriod ? Number(dbSecurity.moratoriumPeriod) : undefined,
    
    // Boolean fields
    isPreferred: dbSecurity.isPreferred,
    hasParticipation: dbSecurity.hasParticipation,
    hasDividendRights: dbSecurity.hasDividendRights,
    isDividendCumulative: dbSecurity.isDividendCumulative,
    hasConversionRights: dbSecurity.hasConversionRights,
    hasRedemptionRights: dbSecurity.hasRedemptionRights,
    hasVotingRights: dbSecurity.hasVotingRights,
    isActive: dbSecurity.isActive,
    
    // String fields
    interestPeriod: dbSecurity.interestPeriod,
    interestRateType: dbSecurity.interestRateType,
    conversionBasis: dbSecurity.conversionBasis,
    optionType: dbSecurity.optionType,
    issueRights: dbSecurity.issueRights,
    convertTo: dbSecurity.convertTo,
    vestingScheduleType: dbSecurity.vestingScheduleType,
    poolName: dbSecurity.poolName,
    couponFrequency: dbSecurity.couponFrequency,
    principalFrequency: dbSecurity.principalFrequency,
    antiDilution: dbSecurity.antiDilution,
    
    // Date fields
    maturityDate: dbSecurity.maturityDate ? new Date(dbSecurity.maturityDate) : undefined,
    expirationDate: dbSecurity.expirationDate ? new Date(dbSecurity.expirationDate) : undefined,
    vestingStart: dbSecurity.vestingStart ? new Date(dbSecurity.vestingStart) : undefined,
    terminationDate: dbSecurity.terminationDate ? new Date(dbSecurity.terminationDate) : undefined
  };
}

/**
 * Create a new security
 * @param data Security data
 * @returns Promise with security response
 */
export async function createSecurity(data: unknown): Promise<SecurityResponse> {
  const parsed = CreateSecuritySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create securities
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.SECURITIES);
      if (!allowed) {
        return { 
          success: false, 
          error: 'Insufficient permissions to create securities' 
        };
      }
      
      // Process date fields - convert string dates to Date objects
      const insertData = {
        securityName: parsed.data.securityName,
        code: parsed.data.code,
        roundId: parsed.data.roundId,
        securityType: parsed.data.securityType,
        currency: parsed.data.currency,
        issuePrice: parsed.data.issuePrice,
        specialTerms: parsed.data.specialTerms,
        
        // Stock fields
        isPreferred: parsed.data.isPreferred,
        liquidationPreference: parsed.data.liquidationPreference,
        hasParticipation: parsed.data.hasParticipation,
        participationCap: parsed.data.participationCap,
        seniority: parsed.data.seniority,
        antiDilution: parsed.data.antiDilution,
        hasDividendRights: parsed.data.hasDividendRights,
        dividendRate: parsed.data.dividendRate,
        isDividendCumulative: parsed.data.isDividendCumulative,
        hasConversionRights: parsed.data.hasConversionRights,
        conversionRatio: parsed.data.conversionRatio,
        hasRedemptionRights: parsed.data.hasRedemptionRights,
        redemptionTerm: parsed.data.redemptionTerm,
        hasVotingRights: parsed.data.hasVotingRights,
        votingRatio: parsed.data.votingRatio,
        
        // Convertible fields
        interestRate: parsed.data.interestRate,
        interestRateType: parsed.data.interestRateType,
        interestPeriod: parsed.data.interestPeriod,
        maturityDate: parsed.data.maturityDate ? new Date(parsed.data.maturityDate) : undefined,
        valuationCap: parsed.data.valuationCap,
        conversionDiscount: parsed.data.conversionDiscount,
        conversionBasis: parsed.data.conversionBasis,
        
        // Option fields
        optionType: parsed.data.optionType,
        expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : undefined,
        strikePrice: parsed.data.strikePrice,
        exerciseWindowDays: parsed.data.exerciseWindowDays,
        issueRights: parsed.data.issueRights,
        convertTo: parsed.data.convertTo,
        totalShares: parsed.data.totalShares,
        vestingStart: parsed.data.vestingStart ? new Date(parsed.data.vestingStart) : undefined,
        vestingMonths: parsed.data.vestingMonths,
        cliffMonths: parsed.data.cliffMonths,
        vestingScheduleType: parsed.data.vestingScheduleType,
        poolName: parsed.data.poolName,
        poolSize: parsed.data.poolSize,
        poolAvailable: parsed.data.poolAvailable,
        isActive: parsed.data.isActive,
        terminationDate: parsed.data.terminationDate ? new Date(parsed.data.terminationDate) : undefined,
        
        // Bond fields
        principal: parsed.data.principal,
        couponRate: parsed.data.couponRate,
        couponFrequency: parsed.data.couponFrequency,
        principalFrequency: parsed.data.principalFrequency,
        tenureMonths: parsed.data.tenureMonths,
        moratoriumPeriod: parsed.data.moratoriumPeriod
      };
      
      // Insert security into the consolidated table
      const [newSecurity] = await db.insert(securities)
        .values(insertData as any)
        .returning();
      
      // Convert to typed Security
      const typedSecurity = convertToTypedSecurity(newSecurity);
      
      return { 
        success: true, 
        data: typedSecurity 
      };
    } catch (error) {
      console.error('Error creating security:', error);
      const message = error instanceof Error ? error.message : 'Failed to create security';
      return { success: false, error: message };
    }
  });
}

/**
 * Update an existing security
 * @param id Security ID
 * @param data Updated security data
 * @returns Promise with security response
 */
export async function updateSecurity(id: number, data: unknown): Promise<SecurityResponse> {
  const parsed = UpdateSecuritySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update securities
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to update securities' };
      }
      
      // Check if security exists
      const existingSecurity = await db.query.securities.findFirst({
        where: eq(securities.id, id)
      });
      
      if (!existingSecurity) {
        return { success: false, error: 'Security not found' };
      }
      
      // Handle date fields - convert string dates to Date objects
      const processedData = { ...parsed.data };
      
      if (parsed.data.maturityDate) {
        processedData.maturityDate = new Date(parsed.data.maturityDate);
      }
      
      if (parsed.data.expirationDate) {
        processedData.expirationDate = new Date(parsed.data.expirationDate);
      }
      
      if (parsed.data.vestingStart) {
        processedData.vestingStart = new Date(parsed.data.vestingStart);
      }
      
      if (parsed.data.terminationDate) {
        processedData.terminationDate = new Date(parsed.data.terminationDate);
      }
      
      // Update security in the consolidated table
      const [updatedSecurity] = await db.update(securities)
        .set(processedData as any)
        .where(eq(securities.id, id))
        .returning();
      
      // Convert to typed Security
      const typedSecurity = convertToTypedSecurity(updatedSecurity);
      
      return { 
        success: true, 
        data: typedSecurity 
      };
    } catch (error) {
      console.error('Error updating security:', error);
      const message = error instanceof Error ? error.message : 'Failed to update security';
      return { success: false, error: message };
    }
  });
}

/**
 * Delete a security
 * @param id Security ID
 * @returns Promise with security response
 */
export async function deleteSecurity(id: number): Promise<SecurityResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete securities
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to delete securities' };
      }
      
      // Check if security exists
      const existingSecurity = await db.query.securities.findFirst({
        where: eq(securities.id, id)
      });
      
      if (!existingSecurity) {
        return { success: false, error: 'Security not found' };
      }
      
      // Delete security from the consolidated table
      const [deletedSecurity] = await db.delete(securities)
        .where(eq(securities.id, id))
        .returning();
      
      // Convert to typed Security
      const typedSecurity = convertToTypedSecurity(deletedSecurity);
      
      return { 
        success: true, 
        data: typedSecurity 
      };
    } catch (error) {
      console.error('Error deleting security:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete security';
      return { success: false, error: message };
    }
  });
}

/**
 * Get a security by ID
 * @param id Security ID
 * @returns Promise with security response
 */
export async function getSecurity(id: number): Promise<SecurityResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view securities
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to view securities' };
      }
      
      // Fetch security from the consolidated table
      const security = await db.query.securities.findFirst({
        where: eq(securities.id, id)
      });
      
      if (!security) {
        return { success: false, error: 'Security not found' };
      }
      
      // Convert to typed Security
      const typedSecurity = convertToTypedSecurity(security);
      
      return { 
        success: true, 
        data: typedSecurity
      };
    } catch (error) {
      console.error('Error fetching security:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch security';
      return { success: false, error: message };
    }
  });
}

/**
 * Get all securities
 * @returns Promise with securities response
 */
export async function getSecurities(): Promise<SecuritiesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view securities
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to view securities' };
      }
      
      // Fetch all securities from the consolidated table
      const results = await db.select().from(securities)
        .orderBy(securities.createdAt);
      
      // Convert each security to typed Security
      const typedSecurities = results.map(security => convertToTypedSecurity(security));
      
      return { 
        success: true, 
        data: typedSecurities
      };
    } catch (error) {
      console.error('Error fetching securities:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch securities';
      return { success: false, error: message };
    }
  });
}

/**
 * Get securities by round ID
 * @param roundId Round ID
 * @returns Promise with securities response
 */
export async function getSecuritiesByRound(roundId: number): Promise<SecuritiesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view securities
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to view securities' };
      }
      
      // Fetch securities by round ID from the consolidated table
      const results = await db.select().from(securities)
        .where(eq(securities.roundId, roundId))
        .orderBy(securities.createdAt);
      
      // Convert each security to typed Security
      const typedSecurities = results.map(security => convertToTypedSecurity(security));
      
      return { 
        success: true, 
        data: typedSecurities
      };
    } catch (error) {
      console.error('Error fetching securities by round:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch securities by round';
      return { success: false, error: message };
    }
  });
}

/**
 * Get securities by type
 * @param securityType Security type
 * @returns Promise with securities response
 */
export async function getSecuritiesByType(securityType: SecurityType): Promise<SecuritiesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view securities
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.SECURITIES);
      
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions to view securities' };
      }
      
      // Fetch securities by type from the consolidated table
      const results = await db.select().from(securities)
        .where(eq(securities.securityType, securityType))
        .orderBy(securities.createdAt);
      
      // Convert each security to typed Security
      const typedSecurities = results.map(security => convertToTypedSecurity(security));
      
      return { 
        success: true, 
        data: typedSecurities
      };
    } catch (error) {
      console.error('Error fetching securities by type:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch securities by type';
      return { success: false, error: message };
    }
  });
}
