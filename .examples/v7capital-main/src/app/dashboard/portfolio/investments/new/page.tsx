import { Metadata } from 'next';
import InvestmentPortfolioForm from '@/modules/assetmanager/components/portfolio-investment/portfolio-investment-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Add Investment',
  description: 'Add a new investment to your portfolio',
};

export default async function NewInvestmentPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <InvestmentPortfolioForm />;
}
