import { db } from '@database/drizzle';
import { eq, inArray } from 'drizzle-orm';
import { companyUsers } from '@database/drizzle/models/companies';
import { stakeholderUsers } from '@database/drizzle/models/captable';
import type { UserProfile } from '@/modules/accounts/schemas/auth.schemas';

/**
 * For stakeholder users, get their stakeholder IDs for filtering
 */
export async function getStakeholderIds(profile: UserProfile): Promise<number[]> {
  // For global users, return empty array (no filtering needed)
  if (profile.role === 'ADMIN' || profile.role === 'EDITOR' || profile.role === 'VIEWER') {
    return [];
  }
  
  // Get stakeholder IDs
  const stakeholders = await db.select()
    .from(stakeholderUsers)
    .where(eq(stakeholderUsers.userProfileId, profile.id));
  
  return stakeholders.map(s => s.stakeholderId);
}

/**
 * For company users, get their company IDs for filtering
 */
export async function getCompanyIds(profile: UserProfile): Promise<number[]> {
  // For global users, return empty array (no filtering needed)
  if (profile.role === 'ADMIN' || profile.role === 'EDITOR' || profile.role === 'VIEWER') {
    return [];
  }
  
  // Get company IDs
  const companies = await db.select()
    .from(companyUsers)
    .where(eq(companyUsers.userProfileId, profile.id));
  
  return companies.map(c => c.companyId);
}