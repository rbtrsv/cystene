import { db } from '@database/drizzle';
import { eq } from 'drizzle-orm';
import { companyUsers } from '@database/drizzle/models/companies';
import { stakeholderUsers } from '@database/drizzle/models/captable';
import type { UserProfile } from '@/modules/accounts/schemas/auth.schemas';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';

/**
 * Enum for actions
 */
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

/**
 * Enum for all entity models
 */
export enum EntityModel {
  COMPANIES = 'companies',
  COMPANIES_FINANCIALS = 'companies_financials',
  STAKEHOLDERS = 'stakeholders',
  TRANSACTIONS = 'transactions',
  FUNDS = 'funds',
  ROUNDS = 'rounds',
  SECURITIES = 'securities',
  INVESTMENT_PORTFOLIO = 'investment_portfolio',
  PORTFOLIO_CASH_FLOW = 'portfolio_cash_flow',
  DEAL_PIPELINE = 'deal_pipeline',
  PORTFOLIO_PERFORMANCE = 'portfolio_performance',
  PERFORMANCE = 'performance',
  FEE_COSTS = 'fee_costs'
}

/**
 * Enum for stakeholder-related entity models
 * Stakeholder users can ONLY view these entities (filtered to their own data)
 * They CANNOT access: COMPANIES, FUNDS, ROUNDS, SECURITIES, DEAL_PIPELINE, FEE_COSTS, etc.
 */
export enum StakeholderEntityModel {
  STAKEHOLDERS = 'stakeholders',       // For cap table (filtered to own row)
  TRANSACTIONS = 'transactions',       // Their own transactions
  PERFORMANCE = 'performance',         // Their own performance metrics
  PORTFOLIO_PERFORMANCE = 'portfolio_performance',  // For reporting NAV charts
  INVESTMENT_PORTFOLIO = 'investment_portfolio'     // For reporting NAV composition
}

// Types based on the enums
export type ActionType = Action;
export type EntityModelType = EntityModel;
export type StakeholderEntityModelType = StakeholderEntityModel;

/**
 * Check if user has global permissions based on role
 * ADMIN: can do everything
 * EDITOR: can create, read, update
 * VIEWER: can only read
 */
export function isGlobalUser(profile: UserProfile, action: ActionType): boolean {
  if (profile.role === 'ADMIN') return true;
  if (profile.role === 'EDITOR' && action !== Action.DELETE) return true;
  if (profile.role === 'VIEWER' && action === Action.VIEW) return true;
  
  return false;
}

/**
 * Check if user is a company user
 * Company users can view, create, and update company-specific data
 * but cannot delete or create new companies
 */
export async function isCompanyUser(profile: UserProfile): Promise<boolean> {
  const result = await db.select()
    .from(companyUsers)
    .where(eq(companyUsers.userProfileId, profile.id))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Check if user is a stakeholder user
 * Stakeholder users can only view their stakeholder-related data
 */
export async function isStakeholderUser(profile: UserProfile): Promise<boolean> {
  const result = await db.select()
    .from(stakeholderUsers)
    .where(eq(stakeholderUsers.userProfileId, profile.id))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Unified permission check that combines all three types
 */
export async function hasPermission(
  profile: UserProfile,
  action: ActionType,
  entityType: EntityModelType
): Promise<boolean> {
  // First check global permissions (fastest)
  if (isGlobalUser(profile, action)) {
    return true;
  }
  
  // For company entities (company users can VIEW and UPDATE, but not CREATE/DELETE companies)
  if (entityType === EntityModel.COMPANIES) {
    const isCompany = await isCompanyUser(profile);
    if (isCompany && (action === Action.VIEW || action === Action.UPDATE)) {
      return true;
    }
    
    // Stakeholder users can also view company data
    if (action === Action.VIEW) {
      const isStakeholder = await isStakeholderUser(profile);
      if (isStakeholder) {
        return true;
      }
    }
  }
  
  // For financial statements (company users have CRU - no DELETE)
  if (entityType === EntityModel.COMPANIES_FINANCIALS) {
    // Company users can CREATE, READ, UPDATE financial data for their companies (no DELETE)
    const isCompany = await isCompanyUser(profile);
    if (isCompany && (action === Action.VIEW || action === Action.CREATE || action === Action.UPDATE)) {
      return true;
    }
  }
  
  // For stakeholder-related entities
  if (Object.values(StakeholderEntityModel).includes(entityType as any)) {
    // Stakeholder users can only view
    const isStakeholder = await isStakeholderUser(profile);
    if (isStakeholder && action === Action.VIEW) {
      return true;
    }
  }

  return false;
}

/**
 * Server action to check if current user can access admin pages
 * (Cap Table Admin, Portfolio Monitoring, Dealflow, Fund Admin, Performance)
 * Returns true for global users (ADMIN, EDITOR, VIEWER), false for stakeholder/company users
 */
export async function canAccessAdminPages(): Promise<boolean> {
  'use server';
  return withAuth(async (profile) => {
    return isGlobalUser(profile, Action.VIEW);
  });
}

/**
 * Server action to check if current user can access company pages
 * (Companies section: financials, metrics, KPIs)
 * Returns true for global users AND company users, false for stakeholder users
 */
export async function canAccessCompanyPages(): Promise<boolean> {
  'use server';
  return withAuth(async (profile) => {
    // Global users can access
    if (isGlobalUser(profile, Action.VIEW)) {
      return true;
    }
    // Company users can access their company pages
    return await isCompanyUser(profile);
  });
}

/**
 * Server action to check if current user is a stakeholder user
 * Used for conditional rendering in reporting page
 */
export async function isCurrentUserStakeholder(): Promise<boolean> {
  'use server';
  return withAuth(async (profile) => {
    return await isStakeholderUser(profile);
  });
}
