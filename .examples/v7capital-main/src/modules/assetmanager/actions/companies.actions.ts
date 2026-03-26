'use server';
import { db } from '@database/drizzle';
import { companies, companyUsers, userProfiles } from '@database/drizzle';
import { eq, and, inArray } from 'drizzle-orm';
import { withAuth } from '@/modules/accounts/permissions/auth.helpers';
import { hasPermission, Action, EntityModel } from '@/modules/assetmanager/permissions/permissions';
import { getCompanyIds } from '@/modules/assetmanager/permissions/filtering.utils';
import { 
  CreateCompanySchema, 
  UpdateCompanySchema,
  CreateCompanyUserSchema,
  UpdateCompanyUserSchema,
  type CompanyResponse,
  type CompaniesResponse,
  type CompanyUserResponse,
  type CompanyUsersResponse,
  type CompanyRole
} from '@/modules/assetmanager/schemas/companies.schemas';

/**
 * Get companies that the current user has access to
 */
export async function getUserCompanies(): Promise<CompaniesResponse> {
  return withAuth(async (profile) => {
    try {
      const result = await db.select().from(companies)
        .innerJoin(companyUsers, eq(companyUsers.companyId, companies.id))
        .where(eq(companyUsers.userProfileId, profile.id));
        
      return {
        success: true,
        data: result.map((r) => r.companies)
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return {
        success: false,
        error: 'Failed to fetch companies'
      };
    }
  });
}

/**
 * Get all companies the user has access to
 */
export async function getCompanies(): Promise<CompaniesResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view companies
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view companies'
        };
      }
      
      // Get company IDs for filtering (if applicable)
      const companyIds = await getCompanyIds(profile);
      
      // Build query based on user type
      let result;
      
      if (companyIds.length > 0) {
        // For company users - filter by their company IDs
        result = await db.select()
          .from(companies)
          .where(inArray(companies.id, companyIds));
      } else {
        // For global users - no filtering
        result = await db.select()
          .from(companies);
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return {
        success: false,
        error: 'Failed to fetch companies'
      };
    }
  });
}

/**
 * Get a single company by ID
 * @param companyId - ID of the company to retrieve
 */
export async function getCompany(companyId: number): Promise<CompanyResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view companies
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this company'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId)
      });
      
      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }
      
      return {
        success: true,
        data: company
      };
    } catch (error) {
      console.error('Error fetching company:', error);
      return {
        success: false,
        error: 'Failed to fetch company'
      };
    }
  });
}

/**
 * Create a new company and associate it with the current user
 * @param data - Company data from the form
 * @param initialRole - Optional role to assign to the creator (defaults to EDITOR)
 */
export async function createCompany(
  data: unknown,
  initialRole: CompanyRole = 'EDITOR'
): Promise<CompanyResponse> {
  const parsed = CreateCompanySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to create companies
      const allowed = await hasPermission(profile, Action.CREATE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to create companies'
        };
      }
      
      // Insert company into database with validated data
      const [newCompany] = await db.insert(companies)
        .values({
          name: parsed.data.name,
          website: parsed.data.website ?? null,
          country: parsed.data.country ?? null
        } as any)
        .returning();

      // Create relationship between user and company with the specified role
      await db.insert(companyUsers)
        .values({
          userProfileId: profile.id,
          companyId: newCompany.id,
          role: initialRole
        } as any);
      
      return {
        success: true,
        data: newCompany
      };
    } catch (error) {
      console.error('Error creating company:', error);
      return {
        success: false,
        error: 'Failed to create company'
      };
    }
  });
}

/**
 * Update a company's information
 * @param companyId - ID of the company to update
 * @param data - Data to update the company with
 */
export async function updateCompany(companyId: number, data: unknown): Promise<CompanyResponse> {
  const parsed = UpdateCompanySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update companies
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update companies'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }

      const [updatedCompany] = await db.update(companies)
        .set({
          name: parsed.data.name,
          website: parsed.data.website ?? null,
          country: parsed.data.country ?? null
        } as any)
        .where(eq(companies.id, companyId))
        .returning();

      return {
        success: true,
        data: updatedCompany
      };
    } catch (error) {
      console.error('Error updating company:', error);
      return {
        success: false,
        error: 'Failed to update company'
      };
    }
  });
}

/**
 * Delete a company
 * @param companyId - ID of the company to delete
 */
export async function deleteCompany(companyId: number): Promise<CompanyResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to delete companies
      const allowed = await hasPermission(profile, Action.DELETE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to delete companies'
        };
      }
      
      const [deletedCompany] = await db.delete(companies)
        .where(eq(companies.id, companyId))
        .returning();

      return {
        success: true,
        data: deletedCompany
      };
    } catch (error) {
      console.error('Error deleting company:', error);
      return {
        success: false,
        error: 'Failed to delete company'
      };
    }
  });
}

/**
 * Get all users for a company
 * @param companyId - ID of the company
 */
export async function getCompanyUsers(companyId: number): Promise<CompanyUsersResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to view companies
      const allowed = await hasPermission(profile, Action.VIEW, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to view this company'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Get company users with profile information
      const result = await db.select({
        userProfileId: companyUsers.userProfileId,
        companyId: companyUsers.companyId,
        role: companyUsers.role,
        profile: {
          id: userProfiles.id,
          name: userProfiles.name,
          email: userProfiles.email
        }
      })
      .from(companyUsers)
      .innerJoin(userProfiles, eq(companyUsers.userProfileId, userProfiles.id))
      .where(eq(companyUsers.companyId, companyId));
      
      // Convert database types to schema types
      const companyUsersList = result.map(r => ({
        userProfileId: r.userProfileId,
        companyId: r.companyId,
        role: r.role as CompanyRole,
        profile: r.profile
      }));
      
      return {
        success: true,
        data: companyUsersList
      };
    } catch (error) {
      console.error('Error fetching company users:', error);
      return {
        success: false,
        error: 'Failed to fetch company users'
      };
    }
  });
}

/**
 * Add a user to a company
 * @param data - User and company data
 */
export async function addCompanyUser(data: unknown): Promise<CompanyUserResponse> {
  const parsed = CreateCompanyUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update companies
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this company'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(parsed.data.companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Check if the user-company relationship already exists
      const existingRelation = await db.select()
        .from(companyUsers)
        .where(
          and(
            eq(companyUsers.userProfileId, parsed.data.userProfileId),
            eq(companyUsers.companyId, parsed.data.companyId)
          )
        )
        .limit(1);
      
      if (existingRelation.length > 0) {
        return {
          success: false,
          error: 'User is already associated with this company'
        };
      }
      
      // Create the relationship
      await db.insert(companyUsers)
        .values({
          userProfileId: parsed.data.userProfileId,
          companyId: parsed.data.companyId,
          role: parsed.data.role
        } as any);
      
      return {
        success: true,
        data: {
          userProfileId: parsed.data.userProfileId,
          companyId: parsed.data.companyId,
          role: parsed.data.role
        }
      };
    } catch (error) {
      console.error('Error adding company user:', error);
      return {
        success: false,
        error: 'Failed to add user to company'
      };
    }
  });
}

/**
 * Update a user's role in a company
 * @param userProfileId - ID of the user
 * @param companyId - ID of the company
 * @param data - Updated role data
 */
export async function updateCompanyUser(
  userProfileId: number, 
  companyId: number, 
  data: unknown
): Promise<CompanyUserResponse> {
  const parsed = UpdateCompanyUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0].message
    };
  }

  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update companies
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this company'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Update the role - use type assertion to handle the role property
      await db.update(companyUsers)
        .set({ role: parsed.data.role } as any)
        .where(
          and(
            eq(companyUsers.userProfileId, userProfileId),
            eq(companyUsers.companyId, companyId)
          )
        );
      
      return {
        success: true,
        data: {
          userProfileId,
          companyId,
          role: parsed.data.role
        }
      };
    } catch (error) {
      console.error('Error updating company user:', error);
      return {
        success: false,
        error: 'Failed to update user role'
      };
    }
  });
}

/**
 * Remove a user from a company
 * @param userProfileId - ID of the user to remove
 * @param companyId - ID of the company
 */
export async function removeCompanyUser(
  userProfileId: number, 
  companyId: number
): Promise<CompanyUserResponse> {
  return withAuth(async (profile) => {
    try {
      // Check if user has permission to update companies
      const allowed = await hasPermission(profile, Action.UPDATE, EntityModel.COMPANIES);
      if (!allowed) {
        return {
          success: false,
          error: 'Insufficient permissions to update this company'
        };
      }
      
      // For company users, check if they have access to this specific company
      const companyIds = await getCompanyIds(profile);
      if (companyIds.length > 0 && !companyIds.includes(companyId)) {
        return {
          success: false,
          error: 'Forbidden: You do not have access to this company'
        };
      }
      
      // Prevent removing the last admin
      if (profile.id === userProfileId) {
        // Check if this is the last admin
        const adminUsers = await db.select()
          .from(companyUsers)
          .where(
            and(
              eq(companyUsers.companyId, companyId),
              eq(companyUsers.role, 'ADMIN')
            )
          );
        
        if (adminUsers.length <= 1) {
          return {
            success: false,
            error: 'Cannot remove the last admin from a company'
          };
        }
      }
      
      // Remove the user from the company
      const [removedRelation] = await db.delete(companyUsers)
        .where(
          and(
            eq(companyUsers.userProfileId, userProfileId),
            eq(companyUsers.companyId, companyId)
          )
        )
        .returning();
      
      if (!removedRelation) {
        return {
          success: false,
          error: 'User is not associated with this company'
        };
      }
      
      return {
        success: true,
        data: {
          userProfileId,
          companyId,
          role: removedRelation.role as CompanyRole
        }
      };
    } catch (error) {
      console.error('Error removing company user:', error);
      return {
        success: false,
        error: 'Failed to remove user from company'
      };
    }
  });
}