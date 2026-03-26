import { Metadata } from 'next';
import CompanyForm from '@/modules/assetmanager/components/companies/company-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Company',
  description: 'Create a new company',
};

export default async function CreateCompanyPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <CompanyForm />
    </div>
  );
}
