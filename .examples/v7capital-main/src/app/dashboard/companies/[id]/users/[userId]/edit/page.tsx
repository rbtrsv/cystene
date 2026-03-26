import { Metadata } from 'next';
import CompanyUsersForm from '@/modules/assetmanager/components/companies/company-users-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit User Role',
  description: 'Update user role for this company',
};

type EditUserRolePageProps = {
  params: Promise<{ id: string; userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUserRolePage({ params }: EditUserRolePageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id, userId } = await params;
  const companyId = parseInt(id, 10);
  const userProfileId = parseInt(userId, 10);

  return <CompanyUsersForm companyId={companyId} userProfileId={userProfileId} />;
}