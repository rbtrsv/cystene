import { Metadata } from 'next';
import InvestmentPortfolioList from '@/modules/assetmanager/components/portfolio-investment/portfolio-investment-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Portfolio Investments',
  description: 'Manage your portfolio investments and track performance',
};

export default async function PortfolioInvestmentsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <InvestmentPortfolioList />;
}
