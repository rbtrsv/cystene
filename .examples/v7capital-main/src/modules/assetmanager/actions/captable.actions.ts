'use server';

import { db } from '@database/drizzle';
import {
  transactions,
  stakeholders,
  securities,
  funds,
  rounds
} from '@database/drizzle';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  type CapTableRow,
  type CapTableSummary,
  type CapTableFilters,
  type ExportFormat,
  capTableRowSchema,
  capTableSummarySchema,
  capTableFiltersSchema
} from '@/modules/assetmanager/schemas/captable.schemas';

// ==========================================
// Main Cap Table Actions
// ==========================================

/**
 * Get computed cap table for a fund (optionally as of a specific round)
 */
export async function getCapTable(
  fundId: number, 
  asOfRoundId?: number
): Promise<{ success: boolean; data?: CapTableRow[]; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions - only admins, editors, and stakeholders can view cap table
      if (!await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get all transactions for the fund up to the specified round
      const whereConditions = [eq(transactions.fundId, fundId)];
      
      if (asOfRoundId) {
        // Get rounds up to and including the specified round
        const roundsUpTo = await db
          .select({ id: rounds.id })
          .from(rounds)
          .where(eq(rounds.fundId, fundId))
          .orderBy(rounds.roundDate);
        
        const roundIds = roundsUpTo
          .filter(r => r.id <= asOfRoundId)
          .map(r => r.id);
          
        whereConditions.push(inArray(transactions.roundId, roundIds));
      }

      // Compute cap table from transactions
      // Entity Perspective: stakeholder balance = SUM(unitsCredit - unitsDebit)
      // - unitsCredit = Fund issues units TO stakeholder (stakeholder receives)
      // - unitsDebit = Fund redeems units FROM stakeholder (stakeholder loses)
      const capTableData = await db
        .select({
          stakeholderId: stakeholders.id,
          stakeholderName: stakeholders.stakeholderName,
          stakeholderType: stakeholders.type,
          totalUnits: sql<number>`COALESCE(SUM(${transactions.unitsCredit} - ${transactions.unitsDebit}), 0)`,
          // Calculate investment using issue price * units instead of raw transaction amounts
          totalInvestment: sql<number>`COALESCE(SUM(
            CASE
              WHEN ${securities.issuePrice} IS NOT NULL
              THEN ${securities.issuePrice} * (${transactions.unitsCredit} - ${transactions.unitsDebit})
              ELSE ${transactions.amountDebit} - ${transactions.amountCredit}
            END
          ), 0)`,
          // Get the most common currency for this stakeholder (or default to USD)
          currency: sql<string>`COALESCE(
            MODE() WITHIN GROUP (ORDER BY ${securities.currency}), 
            'USD'
          )`,
        })
        .from(transactions)
        .innerJoin(stakeholders, eq(transactions.stakeholderId, stakeholders.id))
        .innerJoin(securities, eq(transactions.securityId, securities.id))
        .where(and(...whereConditions))
        .groupBy(
          stakeholders.id,
          stakeholders.stakeholderName,
          stakeholders.type
        )
        .having(sql`SUM(${transactions.unitsCredit} - ${transactions.unitsDebit}) > 0`);

      // Aggregate by stakeholder and compute ownership percentages
      const stakeholderMap = new Map<number, CapTableRow>();
      let totalEquityShares = 0;
      let totalFullyDilutedShares = 0;

      for (const row of capTableData) {
        // Skip rows with zero or negative units
        if (row.totalUnits <= 0) {
          continue;
        }
        
        const stakeholderId = row.stakeholderId;
        
        if (!stakeholderMap.has(stakeholderId)) {
          stakeholderMap.set(stakeholderId, {
            stakeholderId,
            stakeholderName: row.stakeholderName,
            stakeholderType: row.stakeholderType,
            commonShares: 0,
            preferredShares: 0,
            options: 0,
            warrants: 0,
            convertibles: 0,
            totalEquityShares: 0,
            totalFullyDilutedShares: 0,
            equityOwnershipPercentage: 0,
            fullyDilutedOwnershipPercentage: 0,
            totalInvestment: 0,
            averagePricePerShare: 0,
            currency: row.currency || 'USD',
          });
        }

        const stakeholder = stakeholderMap.get(stakeholderId)!;
        const units = Number(row.totalUnits); // Convert string to number
        const investment = Number(row.totalInvestment); // Convert string to number
        
        // For now, treat all units as common shares since we simplified the query
        // TODO: Add security type breakdown in a separate query if needed
        stakeholder.commonShares += units;
        stakeholder.totalEquityShares += units;
        totalEquityShares += units;

        stakeholder.totalFullyDilutedShares += units;
        stakeholder.totalInvestment += investment;
        totalFullyDilutedShares += units;
      }

      // Calculate ownership percentages
      let capTableRows: CapTableRow[] = Array.from(stakeholderMap.values()).map(row => ({
        ...row,
        equityOwnershipPercentage: totalEquityShares > 0
          ? (row.totalEquityShares / totalEquityShares) * 100
          : 0,
        fullyDilutedOwnershipPercentage: totalFullyDilutedShares > 0
          ? (row.totalFullyDilutedShares / totalFullyDilutedShares) * 100
          : 0,
        averagePricePerShare: row.totalEquityShares > 0
          ? row.totalInvestment / row.totalEquityShares
          : 0,
      }));

      // Filter by stakeholder IDs for stakeholder users
      const stakeholderIds = await getStakeholderIds(profile);
      if (stakeholderIds.length > 0) {
        capTableRows = capTableRows.filter(row => stakeholderIds.includes(row.stakeholderId));
      }

      // Sort by ownership percentage (descending)
      capTableRows.sort((a, b) => b.equityOwnershipPercentage - a.equityOwnershipPercentage);

      return { success: true, data: capTableRows };
    } catch (error) {
      console.error('Error fetching cap table:', error);
      return { success: false, error: 'Failed to fetch cap table' };
    }
  });
}

/**
 * Get cap table summary statistics
 */
export async function getCapTableSummary(
  fundId: number,
  asOfRoundId?: number
): Promise<{ success: boolean; data?: CapTableSummary; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions - only admins, editors, and stakeholders can view cap table
      if (!await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get fund info
      const fund = await db
        .select({ name: funds.name })
        .from(funds)
        .where(eq(funds.id, fundId))
        .limit(1);

      if (!fund.length) {
        return { success: false, error: 'Fund not found' };
      }

      // Get round info if specified
      let roundInfo = null;
      if (asOfRoundId) {
        const round = await db
          .select({ roundName: rounds.roundName })
          .from(rounds)
          .where(eq(rounds.id, asOfRoundId))
          .limit(1);
        
        if (round.length) {
          roundInfo = round[0];
        }
      }

      // Get cap table data to compute summary
      const capTableResult = await getCapTable(fundId, asOfRoundId);
      
      if (!capTableResult.success || !capTableResult.data) {
        return { success: false, error: 'Failed to compute cap table summary' };
      }

      const capTableData = capTableResult.data;
      
      const summary: CapTableSummary = {
        fundId,
        fundName: fund[0].name,
        asOfRoundId,
        asOfRoundName: roundInfo?.roundName,
        totalStakeholders: capTableData.length,
        totalEquityShares: capTableData.reduce((sum, row) => sum + row.totalEquityShares, 0),
        totalFullyDilutedShares: capTableData.reduce((sum, row) => sum + row.totalFullyDilutedShares, 0),
        totalValuation: capTableData.reduce((sum, row) => sum + row.totalInvestment, 0),
        lastUpdated: new Date(),
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error fetching cap table summary:', error);
      return { success: false, error: 'Failed to fetch cap table summary' };
    }
  });
}

/**
 * Get available rounds for a fund (for historical cap table views)
 */
export async function getFundRounds(fundId: number): Promise<{
  success: boolean;
  data?: Array<{ id: number; roundName: string; roundDate: string }>;
  error?: string;
}> {
  return withAuth(async (profile) => {
    try {
      // Check permissions - only admins, editors, and stakeholders can view fund rounds
      if (!await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const roundsData = await db
        .select({
          id: rounds.id,
          roundName: rounds.roundName,
          roundDate: rounds.roundDate,
        })
        .from(rounds)
        .where(eq(rounds.fundId, fundId))
        .orderBy(rounds.roundDate);

      return { success: true, data: roundsData };
    } catch (error) {
      console.error('Error fetching fund rounds:', error);
      return { success: false, error: 'Failed to fetch fund rounds' };
    }
  });
}

/**
 * Export cap table data (placeholder for now)
 */
export async function exportCapTable(
  fundId: number,
  format: ExportFormat,
  asOfRoundId?: number
): Promise<{ success: boolean; data?: string; error?: string }> {
  return withAuth(async (profile) => {
    try {
      // Check permissions - only admins, editors, and stakeholders can export cap table
      if (!await hasPermission(profile, Action.VIEW, EntityModel.STAKEHOLDERS)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get cap table data
      const capTableResult = await getCapTable(fundId, asOfRoundId);
      
      if (!capTableResult.success || !capTableResult.data) {
        return { success: false, error: 'Failed to get cap table data for export' };
      }

      // For now, return CSV format (can be extended for Excel/PDF)
      if (format === 'csv') {
        const headers = [
          'Stakeholder Name',
          'Type',
          'Common Shares',
          'Preferred Shares',
          'Options',
          'Warrants',
          'Convertibles',
          'Total Equity Shares',
          'Total Fully Diluted Shares',
          'Equity Ownership %',
          'Fully Diluted Ownership %',
          'Total Investment',
          'Avg Price Per Share'
        ];

        const csvRows = [
          headers.join(','),
          ...capTableResult.data.map(row => [
            `"${row.stakeholderName}"`,
            `"${row.stakeholderType}"`,
            row.commonShares,
            row.preferredShares,
            row.options,
            row.warrants,
            row.convertibles,
            row.totalEquityShares,
            row.totalFullyDilutedShares,
            row.equityOwnershipPercentage.toFixed(2),
            row.fullyDilutedOwnershipPercentage.toFixed(2),
            row.totalInvestment,
            row.averagePricePerShare.toFixed(2)
          ].join(','))
        ];

        return { success: true, data: csvRows.join('\n') };
      }

      return { success: false, error: `Export format ${format} not yet supported` };
    } catch (error) {
      console.error('Error exporting cap table:', error);
      return { success: false, error: 'Failed to export cap table' };
    }
  });
}
