import { Metadata } from 'next';
import CompanyList from '@/modules/assetmanager/components/companies/company-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Companies',
  description: 'Manage your companies and their details',
};

export default async function CompaniesPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CompanyList />;
}
