'use server';

/**
 * ==========================================
 * PERFORMANCE CALCULATIONS OVERVIEW
 * ==========================================
 *
 * This file contains three main performance calculation functions:
 *
 * 1. FUNDS PERFORMANCE (getFundPerformance)
 *    Data Sources:
 *    - portfolioCashFlow table (fund investments & returns)
 *    - feeCosts table (management fees, admin fees)
 *    - investmentPortfolio table (current fair value/NAV)
 *
 *    Calculation:
 *    - Cash flows: Portfolio cash flows (debit - credit) + fees (as negative)
 *    - NAV: Sum of all currentFairValue from portfolio investments
 *    - Total Invested: Sum of negative cash flows (investments + fees)
 *    - Total Returned: Sum of positive cash flows + current NAV
 *    - IRR: Calculated from all cash flows + final NAV
 *
 * 2. COMPANIES PERFORMANCE (getCompanyPerformance, getCompaniesPerformance)
 *    Data Sources:
 *    - portfolioCashFlow table (fund's cash flows per company)
 *    - investmentPortfolio table (current fair value per company)
 *
 *    Calculation:
 *    - Cash flows: Portfolio cash flows filtered by companyId (debit - credit)
 *    - Current Value: Sum of currentFairValue for that company
 *    - Total Invested: Sum of negative cash flows (fund's investments in company)
 *    - Total Returned: Sum of positive cash flows + current value
 *    - IRR: Calculated from company's cash flows + current value
 *
 * 3. STAKEHOLDERS RETURNS (getStakeholdersPerformance)
 *    Data Sources:
 *    - transactions table (capital calls, distributions, units)
 *    - investmentPortfolio table (fund NAV for proportional allocation)
 *
 *    Calculation:
 *    - Cash flows: Stakeholder transactions (debit - credit) = capital calls (negative) + distributions (positive)
 *    - Ownership %: (stakeholder units ÷ total fund units) × 100
 *    - Stakeholder NAV: Fund NAV × ownership %
 *    - Total Invested: Sum of capital calls (negative cash flows)
 *    - Total Returned: Sum of distributions + stakeholder NAV
 *    - IRR: Calculated from cash flows + stakeholder NAV
 *    - Filter: Only stakeholders with units > 0 (excludes clearing accounts)
 *
 * ==========================================
 */

import { db } from '@database/drizzle';
import { portfolioCashFlow, investmentPortfolio } from '@database/drizzle/models/portfolio';
import { transactions, stakeholders, funds, feeCosts, rounds } from '@database/drizzle/models/captable';
import { companies } from '@database/drizzle/models/companies';
import { eq, and, lte, sql, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel, isStakeholderUser, isGlobalUser } from '@/modules/assetmanager/permissions/permissions';
import { getStakeholderIds } from '@/modules/assetmanager/permissions/filtering.utils';

// ==========================================
// Simple IRR Calculation
// ==========================================

function calculateIRR(cashFlows: Array<{ date: Date; amount: number }>): number | null {
  if (cashFlows.length < 2) return null;
  
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const hasPositive = sorted.some(cf => cf.amount > 0);
  const hasNegative = sorted.some(cf => cf.amount < 0);
  if (!hasPositive || !hasNegative) return null;
  
  // Handle extreme negative returns with improved algorithm
  const startingRates = [-0.99, -0.95, -0.9, -0.8, -0.5, -0.1, 0.1, 0.3, 0.5, 1.0];
  
  for (const startingRate of startingRates) {
    let rate = startingRate;
    const firstDate = sorted[0].date;
    
    for (let i = 0; i < 300; i++) {
      let npv = 0;
      let dnpv = 0;
      
      for (const cf of sorted) {
        const years = Math.max(0.001, (cf.date.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        // Avoid numerical issues near -1
        if (rate <= -0.9999) rate = -0.9999;
        
        const factor = Math.pow(1 + rate, years);
        if (factor <= 0 || !isFinite(factor)) break;
        
        npv += cf.amount / factor;
        dnpv -= (cf.amount * years) / Math.pow(1 + rate, years + 1);
      }
      
      if (!isFinite(npv) || !isFinite(dnpv)) break;
      
      if (Math.abs(npv) < 0.01) return rate;
      if (Math.abs(dnpv) < 0.0001) break;
      
      const newRate = rate - npv / dnpv;
      const clampedRate = Math.max(-0.9999, Math.min(50, newRate));
      
      if (!isFinite(clampedRate)) break;
      if (Math.abs(clampedRate - rate) < 0.0001) return clampedRate;
      
      rate = clampedRate;
    }
  }
  
  return null;
}

// ==========================================
// Fund Performance
// ==========================================

export async function getFundPerformance(fundId: number, roundId?: number, endDate?: Date) {
  return withAuth(async (profile) => {
    try {
      // Check permissions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PERFORMANCE);
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get fund details
      const fund = await db.query.funds.findFirst({ where: eq(funds.id, fundId) });
      if (!fund) {
        return { success: false, error: 'Fund not found' };
      }

      // Build filters
      const filters = [
        eq(portfolioCashFlow.fundId, fundId),
        eq(portfolioCashFlow.includeInIrr, true)
      ];
      
      if (roundId) {
        filters.push(eq(portfolioCashFlow.roundId, roundId));
      }
      
      if (endDate) {
        filters.push(lte(portfolioCashFlow.date, endDate.toISOString().split('T')[0]));
      }

      // Get portfolio cash flows
      const portfolioFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(and(...filters));

      // Get fee costs
      const feeFilters = [eq(feeCosts.fundId, fundId)];
      if (roundId) {
        feeFilters.push(eq(feeCosts.roundId, roundId));
      }
      if (endDate) {
        feeFilters.push(lte(feeCosts.date, endDate.toISOString().split('T')[0]));
      }

      const fundFees = await db
        .select()
        .from(feeCosts)
        .where(and(...feeFilters));

      // Build cash flows for IRR calculation
      const allCashFlows: Array<{ date: Date; amount: number }> = [];

      // Add portfolio cash flows
      // ═══════════════════════════════════════════════════════════════════════════
      // FUND PERFORMANCE uses: debit - credit (fund's perspective)
      // This is DIFFERENT from Stakeholder performance which uses: credit - debit
      // ═══════════════════════════════════════════════════════════════════════════
      portfolioFlows.forEach(pf => {
        const debit = parseFloat(pf.amountDebit || '0');
        const credit = parseFloat(pf.amountCredit || '0');
        // Fund's perspective: debit = receives money IN, credit = pays money OUT
        const amount = debit - credit;

        if (amount !== 0) {
          allCashFlows.push({
            date: new Date(pf.date),
            amount: amount
          });
        }
      });

      // Add fees to cash flows
      fundFees.forEach(fee => {
        const feeAmount = parseFloat(fee.amount || '0');
        
        // Include all fees as costs in IRR calculation
        if (feeAmount > 0) {
          allCashFlows.push({
            date: new Date(fee.date),
            amount: -feeAmount
          });
        }
      });

      // Get current fair value from investment portfolio
      const investments = await db.query.investmentPortfolio.findMany({
        where: eq(investmentPortfolio.fundId, fundId)
      });

      const portfolioFairValue = investments.reduce((sum, inv) =>
        sum + (inv.currentFairValue ? Number(inv.currentFairValue) : 0), 0);

      // Calculate totals from portfolio cash flows BEFORE adding NAV
      // totalInvested = sum of investments + fees (negative cash flows)
      // totalReturned = sum of distributions received (positive cash flows, NOT including NAV)
      const totalInvested = allCashFlows.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
      const totalReturned = allCashFlows.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);

      // Add portfolio fair value as final cash flow for IRR calculation only
      if (portfolioFairValue > 0) {
        allCashFlows.push({
          date: new Date(),
          amount: portfolioFairValue
        });
      }

      const netCashFlow = totalReturned - totalInvested;
      const fairValue = portfolioFairValue;

      const irr = calculateIRR(allCashFlows);
      const tvpi = totalInvested > 0 ? (fairValue + totalReturned) / totalInvested : null;
      const dpi = totalInvested > 0 ? totalReturned / totalInvested : null;
      const rvpi = totalInvested > 0 ? fairValue / totalInvested : null;

      // Calculate total fees
      const totalFees = fundFees.reduce((sum, fee) => sum + parseFloat(fee.amount || '0'), 0);

      // Get round name if roundId provided
      let roundName = null;
      if (roundId) {
        const round = await db.query.rounds.findFirst({ where: eq(rounds.id, roundId) });
        roundName = round?.roundName || null;
      }

      return {
        success: true,
        data: {
          fundId,
          fundName: fund.name,
          roundId: roundId || null,
          roundName,
          irr,
          irrPercentage: irr !== null ? irr * 100 : null,
          tvpi,
          dpi,
          rvpi,
          totalInvested,
          totalReturned,
          fairValue,
          netCashFlow,
          totalFees,
          feesBreakdown: fundFees.map(fee => ({
            name: fee.feeCostName,
            type: fee.feeCostType,
            amount: parseFloat(fee.amount || '0'),
            date: fee.date,
            frequency: fee.frequency
          })),
          calculatedAt: new Date(),
          isValid: irr !== null
        }
      };

    } catch (error: any) {
      console.error('Error fetching fund performance:', error);
      return { success: false, error: 'Failed to fetch fund performance' };
    }
  });
}

// ==========================================
// Stakeholders Performance
// ==========================================

export async function getStakeholdersPerformance(fundId: number, roundId?: number, endDate?: Date) {
  return withAuth(async (profile) => {
    try {
      // Check permissions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PERFORMANCE);
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get fund details
      const fund = await db.query.funds.findFirst({ where: eq(funds.id, fundId) });
      if (!fund) {
        return { success: false, error: 'Fund not found' };
      }

      // Get stakeholder IDs for filtering
      const allowedStakeholderIds = await getStakeholderIds(profile);

      // Cache round info to avoid N queries in the loop below
      let selectedRound = null;
      if (roundId) {
        selectedRound = await db.query.rounds.findFirst({ where: eq(rounds.id, roundId) });
      }

      // Build transaction filters for stakeholder identification
      const stakeholderDiscoveryFilters = [eq(transactions.fundId, fundId)];

      // If roundId is specified, only include stakeholders who invested up to that round
      if (selectedRound) {
        stakeholderDiscoveryFilters.push(lte(transactions.transactionDate, selectedRound.roundDate));
      }

      // Get all stakeholders with transactions in this fund (filtered by round if specified)
      // Include stakeholders who have invested (even if they later exited with 0 balance)
      const stakeholderResults = await db
        .select({
          stakeholderId: transactions.stakeholderId,
          totalUnits: sql<number>`SUM(${transactions.unitsCredit} - ${transactions.unitsDebit})`
        })
        .from(transactions)
        .where(and(...stakeholderDiscoveryFilters))
        .groupBy(transactions.stakeholderId)
        // Entity Perspective: stakeholder balance = SUM(unitsCredit - unitsDebit)
        // - unitsCredit = Fund issues units TO stakeholder (stakeholder receives)
        // - unitsDebit = Fund redeems units FROM stakeholder (stakeholder loses)
        // Include stakeholders with units >= 0 (includes exited investors with 0 balance)
        // Exclude stakeholders who ONLY received units via transfers (never invested cash)
        // by checking they have ISSUANCE transactions (amountDebit > 0 means they paid money)
        .having(sql`SUM(${transactions.unitsCredit} - ${transactions.unitsDebit}) >= 0 AND SUM(${transactions.amountDebit}) > 0`);

      const stakeholderIdsInFund = stakeholderResults.map(r => r.stakeholderId);

      // Filter by allowed stakeholders if applicable
      const stakeholderIdsToProcess = allowedStakeholderIds.length > 0
        ? stakeholderIdsInFund.filter(id => allowedStakeholderIds.includes(id))
        : stakeholderIdsInFund;

      if (stakeholderIdsToProcess.length === 0) {
        return { success: true, data: [] };
      }

      // OPTIMIZATION: Fetch all data in bulk queries instead of sequential loops
      // This reduces database queries from ~4N to 5 (where N = number of stakeholders)
      // Critical for Vercel's 10-second timeout limit

      // Query 1/5: Fetch all stakeholders using inArray (single query instead of N queries)
      const stakeholdersMap = new Map();
      const stakeholdersData = await db.query.stakeholders.findMany({
        where: inArray(stakeholders.id, stakeholderIdsToProcess)
      });
      stakeholdersData.forEach(s => stakeholdersMap.set(s.id, s));

      // Query 2/5: Fetch all stakeholder transactions using inArray (single query instead of N queries)
      const txnFilters = [
        inArray(transactions.stakeholderId, stakeholderIdsToProcess),
        eq(transactions.fundId, fundId)
      ];

      if (selectedRound) {
        txnFilters.push(lte(transactions.transactionDate, selectedRound.roundDate));
      }

      if (endDate) {
        txnFilters.push(lte(transactions.transactionDate, endDate.toISOString().split('T')[0]));
      }

      const allTxns = await db
        .select()
        .from(transactions)
        .where(and(...txnFilters));

      // Query 3/5: Get total fund units for ownership % calculation (queried once, not N times)
      const totalUnitsFilters = [eq(transactions.fundId, fundId)];
      if (selectedRound) {
        totalUnitsFilters.push(lte(transactions.transactionDate, selectedRound.roundDate));
      }
      if (endDate) {
        totalUnitsFilters.push(lte(transactions.transactionDate, endDate.toISOString().split('T')[0]));
      }

      const allFundTxns = await db
        .select({
          unitsDebit: transactions.unitsDebit,
          unitsCredit: transactions.unitsCredit
        })
        .from(transactions)
        .where(and(...totalUnitsFilters));

      // Entity Perspective: stakeholder balance = unitsCredit - unitsDebit
      const totalUnits = allFundTxns.reduce(
        (total, txn) => total + (Number(txn.unitsCredit) || 0) - (Number(txn.unitsDebit) || 0), 0
      );

      // Query 4/5: Get fund NAV once (not N times in the loop)
      const fundInvestments = await db.query.investmentPortfolio.findMany({
        where: eq(investmentPortfolio.fundId, fundId)
      });

      const fundNAV = fundInvestments.reduce((sum, inv) =>
        sum + (inv.currentFairValue ? Number(inv.currentFairValue) : 0), 0);

      // Group transactions by stakeholder ID in-memory for fast O(1) lookup
      const txnsByStakeholder = new Map<number, typeof allTxns>();
      allTxns.forEach(txn => {
        if (!txnsByStakeholder.has(txn.stakeholderId)) {
          txnsByStakeholder.set(txn.stakeholderId, []);
        }
        txnsByStakeholder.get(txn.stakeholderId)!.push(txn);
      });

      // Calculate performance for each stakeholder
      const stakeholderPerformances = [];

      for (const stakeholderId of stakeholderIdsToProcess) {
        const stakeholder = stakeholdersMap.get(stakeholderId);
        if (!stakeholder) continue;

        const stakeholderTxns = txnsByStakeholder.get(stakeholderId) || [];

        // Find first investment date for this stakeholder in this fund
        const cashTxns = stakeholderTxns.filter(t => Number(t.amountDebit) > 0 || Number(t.amountCredit) > 0);
        if (cashTxns.length === 0) continue;

        const firstInvestmentDate = new Date(
          cashTxns.reduce((earliest, txn) => {
            const txnDate = new Date(txn.transactionDate);
            const earliestDate = new Date(earliest);
            return txnDate < earliestDate ? txn.transactionDate : earliest;
          }, cashTxns[0].transactionDate)
        );

        // Calculate ownership percentage based on transactions up to the specified round/date
        // Entity Perspective: stakeholder balance = unitsCredit - unitsDebit
        const stakeholderUnits = stakeholderTxns.reduce(
          (total, txn) => total + (Number(txn.unitsCredit) || 0) - (Number(txn.unitsDebit) || 0), 0
        );

        const ownershipPercentage = totalUnits > 0 ? (stakeholderUnits / totalUnits) * 100 : 0;

        // Build cash flows
        const allCashFlows: Array<{ date: Date; amount: number }> = [];

        // Add direct stakeholder cash flows (capital calls and distributions)
        // ═══════════════════════════════════════════════════════════════════════════
        // STAKEHOLDER PERFORMANCE uses: credit - debit (stakeholder's perspective)
        // This is DIFFERENT from Fund/Company performance which uses: debit - credit
        // ═══════════════════════════════════════════════════════════════════════════
        // Entity Perspective: From stakeholder's view for IRR calculation
        // - amountDebit = Fund receives cash = Stakeholder PAYS (negative for stakeholder)
        // - amountCredit = Fund pays cash = Stakeholder RECEIVES (positive for stakeholder)
        // Formula: credit - debit = what stakeholder receives minus what they pay
        cashTxns.forEach(t => {
          const debit = parseFloat(t.amountDebit || '0');
          const credit = parseFloat(t.amountCredit || '0');
          const amount = credit - debit; // Stakeholder's perspective: receives minus pays

          if (amount !== 0) {
            allCashFlows.push({
              date: new Date(t.transactionDate),
              amount: amount
            });
          }
        });

        // Calculate totals from transaction cash flows BEFORE adding NAV
        // totalInvested = sum of what stakeholder paid (negative cash flows)
        // totalReturned = sum of distributions received (positive cash flows, NOT including NAV)
        const totalInvested = allCashFlows.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
        const totalReturned = allCashFlows.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);

        // Stakeholder's share of NAV
        const stakeholderNAV = fundNAV * (ownershipPercentage / 100);

        // Add stakeholder NAV as final cash flow for IRR calculation only
        if (stakeholderNAV > 0) {
          allCashFlows.push({
            date: new Date(),
            amount: stakeholderNAV
          });
        }

        const netCashFlow = totalReturned - totalInvested;

        const fairValue = stakeholderNAV;

        const irr = calculateIRR(allCashFlows);

        const tvpi = totalInvested > 0 ? (fairValue + totalReturned) / totalInvested : null;
        const dpi = totalInvested > 0 ? totalReturned / totalInvested : null;
        const rvpi = totalInvested > 0 ? fairValue / totalInvested : null;

        stakeholderPerformances.push({
          stakeholderId,
          stakeholderName: stakeholder.stakeholderName,
          fundId,
          fundName: fund.name,
          ownershipPercentage,
          firstInvestmentDate,
          irr,
          irrPercentage: irr !== null ? irr * 100 : null,
          tvpi,
          dpi,
          rvpi,
          totalInvested,
          totalReturned,
          fairValue,
          netCashFlow,
          calculatedAt: new Date(),
          isValid: irr !== null
        });
      }

      return {
        success: true,
        data: stakeholderPerformances
      };

    } catch (error: any) {
      console.error('Error fetching stakeholders performance:', error);
      return { success: false, error: 'Failed to fetch stakeholders performance' };
    }
  });
}

// ==========================================
// Company Performance
// ==========================================

export async function getCompanyPerformance(companyId: number, endDate?: Date) {
  return withAuth(async (profile) => {
    try {
      // Check permissions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PERFORMANCE);
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Stakeholders cannot view company performance (unless also a global user)
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder && !isGlobalUser(profile, Action.VIEW)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get company details
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId) 
      });
      if (!company) {
        return { success: false, error: 'Company not found' };
      }

      // Build filters for portfolio cash flows
      const filters = [
        eq(portfolioCashFlow.companyId, companyId),
        eq(portfolioCashFlow.includeInIrr, true)
      ];
      
      if (endDate) {
        filters.push(lte(portfolioCashFlow.date, endDate.toISOString().split('T')[0]));
      }

      // Get portfolio cash flows for this company
      const companyFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(and(...filters));

      // Build cash flows for IRR calculation
      const allCashFlows: Array<{ date: Date; amount: number }> = [];

      // ═══════════════════════════════════════════════════════════════════════════
      // COMPANY PERFORMANCE uses: debit - credit (fund's perspective)
      // This is DIFFERENT from Stakeholder performance which uses: credit - debit
      // ═══════════════════════════════════════════════════════════════════════════
      companyFlows.forEach(flow => {
        const debit = parseFloat(flow.amountDebit || '0');
        const credit = parseFloat(flow.amountCredit || '0');
        // Fund's perspective: debit = receives money IN, credit = pays money OUT
        const amount = debit - credit;

        if (amount !== 0) {
          allCashFlows.push({
            date: new Date(flow.date),
            amount: amount
          });
        }
      });

      // Calculate metrics
      const totalInvested = allCashFlows.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
      const totalReturned = allCashFlows.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
      const netCashFlow = totalReturned - totalInvested;
      
      // Get current value from investmentPortfolio
      const investments = await db.query.investmentPortfolio.findMany({
        where: eq(investmentPortfolio.companyId, companyId)
      });

      const currentValue = investments.reduce((sum, inv) =>
        sum + (inv.currentFairValue ? Number(inv.currentFairValue) : 0), 0);
      const fairValue = currentValue;
      
      const irr = calculateIRR(allCashFlows);
      const tvpi = totalInvested > 0 ? (fairValue + totalReturned) / totalInvested : null;
      const dpi = totalInvested > 0 ? totalReturned / totalInvested : null;
      const rvpi = totalInvested > 0 ? fairValue / totalInvested : null;

      return {
        success: true,
        data: {
          companyId,
          companyName: company.name,
          irr,
          irrPercentage: irr !== null ? irr * 100 : null,
          tvpi,
          dpi,
          rvpi,
          totalInvested,
          totalReturned,
          fairValue,
          netCashFlow,
          cashFlowCount: companyFlows.length,
          calculatedAt: new Date(),
          isValid: irr !== null
        }
      };

    } catch (error: any) {
      console.error('Error fetching company performance:', error);
      return { success: false, error: 'Failed to fetch company performance' };
    }
  });
}

export async function getCompaniesPerformance(fundId?: number, endDate?: Date) {
  return withAuth(async (profile) => {
    try {
      // Check permissions
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.PERFORMANCE);
      if (!allowed) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Stakeholders cannot view companies performance (unless also a global user)
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder && !isGlobalUser(profile, Action.VIEW)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Build filters
      const filters = [eq(portfolioCashFlow.includeInIrr, true)];

      if (fundId) {
        filters.push(eq(portfolioCashFlow.fundId, fundId));
      }

      if (endDate) {
        filters.push(lte(portfolioCashFlow.date, endDate.toISOString().split('T')[0]));
      }

      // OPTIMIZATION: Fetch all data in bulk queries instead of sequential loops
      // This reduces database queries from 3N to 3 (where N = number of companies)
      // Critical for Vercel's 10-second timeout limit

      // Query 1/3: Get all portfolio cash flows at once
      const allFlows = await db
        .select()
        .from(portfolioCashFlow)
        .where(and(...filters));

      // Get distinct company IDs
      const companyIds = [...new Set(allFlows.map(f => f.companyId))];

      if (companyIds.length === 0) {
        return { success: true, data: [] };
      }

      // Query 2/3: Fetch all companies using inArray (single query instead of N queries)
      const companiesMap = new Map();
      const companiesData = await db.query.companies.findMany({
        where: inArray(companies.id, companyIds)
      });
      companiesData.forEach(c => companiesMap.set(c.id, c));

      // Query 3/3: Fetch all investments using inArray (single query instead of N queries)
      const investmentFilters = [inArray(investmentPortfolio.companyId, companyIds)];
      if (fundId) {
        investmentFilters.push(eq(investmentPortfolio.fundId, fundId));
      }

      const allInvestments = await db.query.investmentPortfolio.findMany({
        where: and(...investmentFilters)
      });

      // Group data by company ID in-memory for fast O(1) lookup
      const flowsByCompany = new Map<number, typeof allFlows>();
      const investmentsByCompany = new Map<number, typeof allInvestments>();

      allFlows.forEach(flow => {
        if (!flowsByCompany.has(flow.companyId)) {
          flowsByCompany.set(flow.companyId, []);
        }
        flowsByCompany.get(flow.companyId)!.push(flow);
      });

      allInvestments.forEach(inv => {
        if (!investmentsByCompany.has(inv.companyId)) {
          investmentsByCompany.set(inv.companyId, []);
        }
        investmentsByCompany.get(inv.companyId)!.push(inv);
      });

      // Calculate performance for each company
      const companyPerformances = [];

      for (const companyId of companyIds) {
        const company = companiesMap.get(companyId);
        if (!company) continue;

        const companyFlows = flowsByCompany.get(companyId) || [];

        // Build cash flows
        const allCashFlows: Array<{ date: Date; amount: number }> = [];

        // ═══════════════════════════════════════════════════════════════════════════
        // COMPANY PERFORMANCE uses: debit - credit (fund's perspective)
        // This is DIFFERENT from Stakeholder performance which uses: credit - debit
        // ═══════════════════════════════════════════════════════════════════════════
        companyFlows.forEach(flow => {
          const debit = parseFloat(flow.amountDebit || '0');
          const credit = parseFloat(flow.amountCredit || '0');
          // Fund's perspective: debit = receives money IN, credit = pays money OUT
          const amount = debit - credit;

          if (amount !== 0) {
            allCashFlows.push({
              date: new Date(flow.date),
              amount: amount
            });
          }
        });

        // Calculate metrics
        const totalInvested = allCashFlows.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
        const totalReturned = allCashFlows.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
        const netCashFlow = totalReturned - totalInvested;

        // Get current value
        const investments = investmentsByCompany.get(companyId) || [];
        const currentValue = investments.reduce((sum, inv) =>
          sum + (inv.currentFairValue ? Number(inv.currentFairValue) : 0), 0);

        // Add current fair value as final cash flow for IRR calculation
        if (currentValue > 0) {
          allCashFlows.push({
            date: new Date(),
            amount: currentValue
          });
        }

        const fairValue = currentValue;

        const irr = calculateIRR(allCashFlows);
        const tvpi = totalInvested > 0 ? (fairValue + totalReturned) / totalInvested : null;
        const dpi = totalInvested > 0 ? totalReturned / totalInvested : null;
        const rvpi = totalInvested > 0 ? fairValue / totalInvested : null;

        companyPerformances.push({
          companyId,
          companyName: company.name,
          irr,
          irrPercentage: irr !== null ? irr * 100 : null,
          tvpi,
          dpi,
          rvpi,
          totalInvested,
          totalReturned,
          fairValue,
          netCashFlow,
          cashFlowCount: companyFlows.length,
          calculatedAt: new Date(),
          isValid: irr !== null
        });
      }

      return {
        success: true,
        data: companyPerformances
      };

    } catch (error: any) {
      console.error('Error fetching companies performance:', error);
      return { success: false, error: 'Failed to fetch companies performance' };
    }
  });
}