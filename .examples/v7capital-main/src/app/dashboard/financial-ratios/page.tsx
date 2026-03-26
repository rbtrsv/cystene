import { Metadata } from 'next';
import FinancialRatiosList from '@/modules/assetmanager/components/financial-ratios/financial-ratios-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Financial Ratios',
  description: 'Manage financial ratios and analytical metrics',
};

export default async function FinancialRatiosPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FinancialRatiosList />;
}