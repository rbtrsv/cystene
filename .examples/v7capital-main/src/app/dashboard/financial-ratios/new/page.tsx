import { Metadata } from 'next';
import FinancialRatiosForm from '@/modules/assetmanager/components/financial-ratios/financial-ratios-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Financial Ratios',
  description: 'Create new financial ratios for a company',
};

export default async function CreateFinancialRatiosPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FinancialRatiosForm />;
}