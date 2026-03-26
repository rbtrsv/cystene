import { Metadata } from 'next';
import CompanyDetail from '@/modules/assetmanager/components/companies/company-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Company Details',
  description: 'View and manage company details',
};

type CompanyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const companyId = parseInt(id, 10);

  return <CompanyDetail id={companyId} />;
}
