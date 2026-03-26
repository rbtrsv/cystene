import { Metadata } from 'next';
import CompanyForm from '@/modules/assetmanager/components/companies/company-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Company',
  description: 'Edit company details',
};

type EditCompanyPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const companyId = parseInt(id, 10);

  return (
    <div className="flex flex-col gap-8">
      <CompanyForm id={companyId} />
    </div>
  );
}
