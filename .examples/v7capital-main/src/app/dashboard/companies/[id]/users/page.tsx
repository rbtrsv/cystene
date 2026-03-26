import { Metadata } from 'next';
import CompanyUsersForm from '@/modules/assetmanager/components/companies/company-users-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Manage Company Users',
  description: 'Add, edit or remove users for this company',
};

type CompanyUsersPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanyUsersPage({ params }: CompanyUsersPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const companyId = parseInt(id, 10);

  return <CompanyUsersForm companyId={companyId} />;
}
